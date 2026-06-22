import { Marker } from 'react-leaflet'
import L from 'leaflet'

const CATEGORY_COLORS = {
  general:  '#c8a96e',
  shire:    '#7bc67e',
  elvish:   '#a8d8ea',
  dwarven:  '#c97b3c',
  mordor:   '#cc3333',
  gondor:   '#c0c0c0',
  rohan:    '#d4af37',
}

function createPinIcon(category) {
  const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.general
  return L.divIcon({
    className: '',
    html: `<div class="map-pin" style="--pin-color:${color}"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

export default function PinMarker({ pin, onClick }) {
  return (
    <Marker
      position={[pin.y, pin.x]}
      icon={createPinIcon(pin.category)}
      eventHandlers={{ click: onClick }}
    />
  )
}
