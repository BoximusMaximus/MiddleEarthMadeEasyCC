import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { CATEGORY_COLORS } from './Sidebar'

function createLocationIcon(category, selected) {
  const color = CATEGORY_COLORS[category] ?? '#ffd700'
  const size = selected ? 20 : 16
  return L.divIcon({
    className: '',
    html: `<div class="location-pin${selected ? ' selected' : ''}" style="--loc-color:${color};width:${size}px;height:${size}px"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export default function LocationMarker({ location, selected, onClick }) {
  return (
    <Marker
      position={[location.y, location.x]}
      icon={createLocationIcon(location.category, selected)}
      eventHandlers={{ click: onClick }}
      zIndexOffset={500}
    >
      <Tooltip
        permanent
        direction="top"
        offset={[0, selected ? -10 : -8]}
        className="pin-label-tooltip location-label"
      >
        {location.name}
      </Tooltip>
    </Marker>
  )
}
