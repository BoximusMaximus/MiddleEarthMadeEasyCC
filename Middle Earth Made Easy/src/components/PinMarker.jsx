// PinMarker — renders a single user-placed pin on the Leaflet map.
// Uses a Leaflet divIcon so the marker is an HTML <div> rather than the default image sprite.
// This lets us apply CSS (color, glow, scale on hover/select) that responds to the pin's category.
import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'

// Each category maps to a color that is set as a CSS custom property (--pin-color) on the div.
// MapView.css uses this variable to control the background color and glow effect.
const CATEGORY_COLORS = {
  elven:  '#4a9e4a',
  human:  '#e8e8e8',
  orc:    '#cc3333',
  dwarf:  '#8a8070',
  hobbit: '#5b8dd9',
  goblin: '#c8c820',
  beast:  '#e07820',
}

// Creates a Leaflet divIcon for the pin.
// The CSS class ('map-pin' or 'map-pin selected') controls the visual state.
// The color is injected as an inline CSS variable so the stylesheet's var(--pin-color) picks it up.
function createPinIcon(category, selected) {
  const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.human
  const cls = selected ? 'map-pin selected' : 'map-pin'
  return L.divIcon({
    className: '',           // Empty string suppresses Leaflet's default icon styling
    html: `<div class="${cls}" style="--pin-color:${color}"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],    // Center of the icon sits at the pin's coordinate
  })
}

// Renders the pin marker at its stored (x, y) position with a permanent name tooltip above it.
// onClick is called whether the user clicks in measure mode (to snap a waypoint) or normal mode (to edit).
export default function PinMarker({ pin, selected, onClick }) {
  return (
    <Marker
      position={[pin.y, pin.x]}              // Leaflet uses [lat, lng] = [y, x] in CRS.Simple
      icon={createPinIcon(pin.category, selected)}
      eventHandlers={{ click: onClick }}
    >
      {/* Permanent tooltip: always visible label above the pin */}
      <Tooltip permanent direction="top" offset={[0, -11]} className="pin-label-tooltip">
        {pin.name}
      </Tooltip>
    </Marker>
  )
}
