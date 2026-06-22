import { MapContainer, ImageOverlay, useMapEvents, Marker, Polyline, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './MapView.css'
import middleEarthMap from '../assets/middle-earth-map.jpg'
import PinMarker from './PinMarker'
import LocationMarker from './LocationMarker'

const IMAGE_WIDTH  = 10000
const IMAGE_HEIGHT = 5455
const bounds = [[0, 0], [IMAGE_HEIGHT, IMAGE_WIDTH]]

function PreviewPin({ latlng }) {
  const icon = L.divIcon({
    className: '',
    html: '<div class="map-pin preview"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
  return <Marker position={[latlng.lat, latlng.lng]} icon={icon} interactive={false} zIndexOffset={1000} />
}

function MapClickHandler({ onMapClick, placementMode, measureMode }) {
  useMapEvents({
    click(e) {
      if (placementMode || measureMode) onMapClick(e.latlng)
    },
  })
  return null
}

export default function MapView({
  pins, placementMode, selectedPin, newPinPosition, onMapClick, onPinClick,
  locations = [], selectedLocation, onLocationClick,
  measureMode, activePath = [], activePathMiles,
  savedPaths = [], selectedPath, onSelectPath,
}) {
  const mapClass = [placementMode && 'placement-mode', measureMode && 'measure-mode']
    .filter(Boolean).join(' ')

  const lastPt = activePath[activePath.length - 1]

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={bounds}
      maxBounds={bounds}
      maxBoundsViscosity={1.0}
      className={mapClass}
      style={{ flex: 1, height: '100vh', background: '#1a1208' }}
      minZoom={-3}
      maxZoom={0}
      zoomSnap={0.25}
    >
      <ImageOverlay url={middleEarthMap} bounds={bounds} />
      <MapClickHandler onMapClick={onMapClick} placementMode={placementMode} measureMode={measureMode} />
      {newPinPosition && <PreviewPin latlng={newPinPosition} />}

      {/* Saved paths */}
      {savedPaths.map(path => {
        const isSelected = selectedPath?.id === path.id
        return (
          <Polyline
            key={path.id}
            positions={path.points.map(p => [p.y, p.x])}
            color={isSelected ? '#ffffff' : '#251c04'}
            weight={isSelected ? 3 : 2}
            opacity={isSelected ? 0.9 : 0.8}
            dashArray={isSelected ? undefined : '5 4'}
            eventHandlers={{ click: () => onSelectPath(selectedPath?.id === path.id ? null : path) }}
          />
        )
      })}

      {/* Active measurement path */}
      {activePath.length >= 2 && (
        <Polyline
          positions={activePath.map(p => [p.y, p.x])}
          color="#ffd700"
          weight={2}
          dashArray="8 5"
          opacity={0.88}
        />
      )}
      {activePath.map((p, i) => (
        <CircleMarker
          key={i}
          center={[p.y, p.x]}
          radius={i === 0 || i === activePath.length - 1 ? 5 : 3}
          color="#ffd700"
          fillColor="#ffd700"
          fillOpacity={1}
          weight={1.5}
        />
      ))}
      {activePath.length >= 2 && lastPt && (
        <Marker
          position={[lastPt.y, lastPt.x]}
          icon={L.divIcon({
            className: 'measure-label-icon',
            html: `<div class="measure-label">${activePathMiles.toFixed(1)} mi</div>`,
            iconSize: [120, 32],
            iconAnchor: [60, 46],
          })}
          interactive={false}
          zIndexOffset={2000}
        />
      )}

      {locations.map(loc => (
        <LocationMarker
          key={loc.id}
          location={loc}
          selected={selectedLocation?.id === loc.id}
          onClick={() => onLocationClick?.(loc)}
        />
      ))}
      {pins.map(pin => (
        <PinMarker
          key={pin.id}
          pin={pin}
          selected={selectedPin?.id === pin.id}
          onClick={() => onPinClick(pin)}
        />
      ))}
    </MapContainer>
  )
}
