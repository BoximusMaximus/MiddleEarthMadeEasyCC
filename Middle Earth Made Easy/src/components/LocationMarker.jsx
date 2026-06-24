// LocationMarker — renders a permanent Middle Earth location on the map as a category-specific SVG icon.
// Unlike user pins (circles), each category gets a unique icon shape (castle, spire, hobbit hole, etc.).
// The icon is built by injecting SVG path data into an inline <svg> element via L.divIcon.
// Selecting a location makes the icon 32px instead of 27px to give visual feedback.
import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { CATEGORY_COLORS } from './Sidebar'

// SVG icon definitions — each returns an SVG path/shape string for its category.
// The color parameter (c) is the hex color for the category, injected as the fill value.
// All shapes are designed for a 24×24 viewBox to keep the coordinate math simple.
const ICONS = {
  // Castle with crenellated battlements and arched gate
  human: (c) => `
    <path d="M2 22V13H5V9H7V13H9V9H15V13H17V9H19V13H22V22Z" fill="${c}"/>
    <path d="M10 22V18Q12 14 14 18V22Z" fill="rgba(0,0,0,0.42)"/>`,

  // Elegant spire + columned palace + pointed arch doorway
  elven: (c) => `
    <path d="M12 1L14.5 6.5H9.5Z" fill="${c}"/>
    <rect x="7.5" y="6.5" width="9" height="15.5" fill="${c}" opacity="0.92"/>
    <line x1="10.5" y1="6.5" x2="10.5" y2="22" stroke="rgba(0,0,0,0.28)" stroke-width="1.2"/>
    <line x1="13.5" y1="6.5" x2="13.5" y2="22" stroke="rgba(0,0,0,0.28)" stroke-width="1.2"/>
    <path d="M10.5 22V18L12 14.5L13.5 18V22Z" fill="rgba(0,0,0,0.48)"/>`,

  // Jagged spiked fortress with brutal rectangular gate
  orc: (c) => `
    <path d="M2 22V14H4V10L7 8L9 12L12 5L15 12L17 8L20 10V14H22V22Z" fill="${c}"/>
    <rect x="10" y="17" width="4" height="5" fill="rgba(0,0,0,0.48)"/>`,

  // Grassy hill with round door and two porthole windows
  hobbit: (c) => `
    <path d="M2 22Q2 10 12 8Q22 10 22 22Z" fill="${c}"/>
    <circle cx="12" cy="19" r="4" fill="rgba(0,0,0,0.38)"/>
    <circle cx="12" cy="19" r="2.5" fill="${c}" opacity="0.72"/>
    <line x1="10.2" y1="19" x2="13.8" y2="19" stroke="rgba(0,0,0,0.35)" stroke-width="0.9"/>
    <circle cx="13.2" cy="19" r="0.6" fill="rgba(0,0,0,0.5)"/>
    <circle cx="7.2" cy="15.2" r="2" fill="rgba(0,0,0,0.22)"/>
    <circle cx="16.8" cy="15.2" r="2" fill="rgba(0,0,0,0.22)"/>`,

  // Mountain peak with snow cap and arched mine entrance
  dwarf: (c) => `
    <path d="M12 2L22 22H2Z" fill="${c}"/>
    <path d="M12 2L16 11H8Z" fill="rgba(255,255,255,0.28)"/>
    <path d="M10 22V18Q12 15 14 18V22Z" fill="rgba(0,0,0,0.48)"/>`,

  // Four toe pads + large central palm pad (animal paw print)
  beast: (c) => `
    <circle cx="12" cy="17" r="5.5" fill="${c}"/>
    <circle cx="6.5" cy="11" r="2.5" fill="${c}"/>
    <circle cx="10.5" cy="8.5" r="2.5" fill="${c}"/>
    <circle cx="13.5" cy="8.5" r="2.5" fill="${c}"/>
    <circle cx="17.5" cy="11" r="2.5" fill="${c}"/>`,

  // Skull with hollow eye sockets and protruding teeth
  goblin: (c) => `
    <path d="M12 2Q18 2 18 9Q18 15 14.5 16L15 20H9L9.5 16Q6 15 6 9Q6 2 12 2Z" fill="${c}"/>
    <ellipse cx="9.5" cy="9" rx="2.1" ry="2.3" fill="rgba(0,0,0,0.48)"/>
    <ellipse cx="14.5" cy="9" rx="2.1" ry="2.3" fill="rgba(0,0,0,0.48)"/>
    <rect x="9.2" y="20" width="2" height="2.8" fill="${c}" opacity="0.88"/>
    <rect x="12.8" y="20" width="2" height="2.8" fill="${c}" opacity="0.88"/>`,
}

// Builds the complete divIcon for a location marker.
// The SVG stroke on the <g> element cascades to all child shapes and creates a dark outline.
// paint-order="stroke fill" ensures the outline is drawn behind the fill (not on top of it).
// A drop-shadow CSS filter adds a glowing halo in the category color.
function createLocationIcon(category, color, selected) {
  const size = selected ? 32 : 27
  const svgFn = ICONS[category] ?? ICONS.human
  const html = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" style="overflow:visible;filter:drop-shadow(0 0 5px ${color}) drop-shadow(0 2px 5px rgba(0,0,0,0.85))"><g stroke="rgba(6,3,0,0.92)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke fill">${svgFn(color)}</g></svg>`
  return L.divIcon({
    className: '',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2], // Center of the icon sits at the location's coordinate
  })
}

// Renders the location icon and a permanent name label above it.
// The tooltip offset is calculated from the icon size so it always sits just above the icon top.
export default function LocationMarker({ location, selected, onClick }) {
  const size = selected ? 32 : 27
  const color = CATEGORY_COLORS[location.category] ?? '#ffd700'
  return (
    <Marker
      position={[location.y, location.x]}
      icon={createLocationIcon(location.category, color, selected)}
      eventHandlers={{ click: onClick }}
      zIndexOffset={500}   // Render above user pins (zIndexOffset 0) but below measurement labels (2000)
    >
      <Tooltip
        permanent
        direction="top"
        offset={[0, -(Math.floor(size / 2) + 6)]}  // Sits just above the top edge of the icon
        className="pin-label-tooltip location-label"
      >
        {location.name}
      </Tooltip>
    </Marker>
  )
}
