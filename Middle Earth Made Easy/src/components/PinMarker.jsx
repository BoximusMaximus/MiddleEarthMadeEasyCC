import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'

const CATEGORY_COLORS = {
  elven:  '#4a9e4a',
  human:  '#e8e8e8',
  orc:    '#cc3333',
  dwarf:  '#8a8070',
  hobbit: '#5b8dd9',
  goblin: '#c8c820',
  beast:  '#e07820',
}

function createPinIcon(category, selected) {
  const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.human
  const cls = selected ? 'map-pin selected' : 'map-pin'
  return L.divIcon({
    className: '',
    html: `<div class="${cls}" style="--pin-color:${color}"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

export default function PinMarker({ pin, selected, onClick }) {
  return (
    <Marker
      position={[pin.y, pin.x]}
      icon={createPinIcon(pin.category, selected)}
      eventHandlers={{ click: onClick }}
    >
      <Tooltip permanent direction="top" offset={[0, -11]} className="pin-label-tooltip">
        {pin.name}
      </Tooltip>
    </Marker>
  )
}
