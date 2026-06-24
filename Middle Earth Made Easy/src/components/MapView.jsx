// MapView — the Leaflet map container. A "dumb" component: it receives all data and callbacks
// as props and has no state of its own. It renders the map image, all markers and paths,
// and fires events back to MapPage when the user interacts with the map.
import { MapContainer, ImageOverlay, useMapEvents, Marker, Polyline, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'   // Required — Leaflet's internal layout/positioning styles
import './MapView.css'
import middleEarthMap from '../assets/middle-earth-map.jpg'
import PinMarker from './PinMarker'
import LocationMarker from './LocationMarker'

// The map image dimensions in pixels. These define the coordinate space.
// In Leaflet's CRS.Simple: x goes right (0 → IMAGE_WIDTH), y goes down (0 → IMAGE_HEIGHT).
// Note: Leaflet stores coordinates as { lat: y, lng: x } — the axes appear "swapped".
const IMAGE_WIDTH  = 10000
const IMAGE_HEIGHT = 5455
const bounds = [[0, 0], [IMAGE_HEIGHT, IMAGE_WIDTH]] // [[minY, minX], [maxY, maxX]]

// Renders the animated gold "preview pin" at the cursor position while the user is naming a new pin.
// interactive={false} prevents it from capturing clicks.
function PreviewPin({ latlng }) {
  const icon = L.divIcon({
    className: '',
    html: '<div class="map-pin preview"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
  return <Marker position={[latlng.lat, latlng.lng]} icon={icon} interactive={false} zIndexOffset={1000} />
}

// Invisible component that lives inside the MapContainer to listen for click events.
// useMapEvents only works when rendered as a child of MapContainer.
// Fires onMapClick only in placement or measure mode to avoid accidental interactions.
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
  // Apply a CSS class to the Leaflet container to change the cursor based on active mode
  const mapClass = [placementMode && 'placement-mode', measureMode && 'measure-mode']
    .filter(Boolean).join(' ')

  // The last waypoint in the active path — where the distance label is anchored
  const lastPt = activePath[activePath.length - 1]

  return (
    <MapContainer
      crs={L.CRS.Simple}          // Non-geographic pixel coordinate system (no lat/lng projection)
      bounds={bounds}             // Initial view: fit the whole image
      maxBounds={bounds}          // Pan lock: user cannot scroll outside the image
      maxBoundsViscosity={1.0}    // Hard boundary — the map snaps back with full resistance
      className={mapClass}
      style={{ flex: 1, height: '100vh', background: '#1a1208' }}
      minZoom={-3}                // Allow zooming out to see the whole map
      maxZoom={0}                 // Don't allow zooming in beyond the image's native resolution
      zoomSnap={0.25}             // Smooth zoom steps
    >
      {/* The Middle Earth map image covers the entire coordinate space */}
      <ImageOverlay url={middleEarthMap} bounds={bounds} />

      {/* Click listener — fires only in placement or measure mode */}
      <MapClickHandler onMapClick={onMapClick} placementMode={placementMode} measureMode={measureMode} />

      {/* Gold pulsing preview pin shown while a new pin is being named in the sidebar */}
      {newPinPosition && <PreviewPin latlng={newPinPosition} />}

      {/* ── Saved measurement paths ──────────────────────────────────────────
          Dim when not selected; highlighted and solid when selected.
          Clicking a path toggles its selected state. */}
      {savedPaths.map(path => {
        const isSelected = selectedPath?.id === path.id
        return (
          <Polyline
            key={path.id}
            positions={path.points.map(p => [p.y, p.x])}
            color={isSelected ? '#ffffff' : '#251c04'}
            weight={isSelected ? 3 : 2}
            opacity={isSelected ? 0.9 : 0.8}
            dashArray={isSelected ? undefined : '5 4'} // Solid when selected, dashed when not
            eventHandlers={{ click: () => onSelectPath(selectedPath?.id === path.id ? null : path) }}
          />
        )
      })}

      {/* ── Active measurement path being drawn ──────────────────────────────
          Polyline styling is set via SVG props (color, weight, dashArray), NOT CSS.
          These props map directly to SVG stroke attributes on the rendered <path> element. */}
      {activePath.length >= 2 && (
        <Polyline
          positions={activePath.map(p => [p.y, p.x])}
          color="#ffd700"
          weight={4}           // Stroke width in pixels
          dashArray="8 5"      // 8px dash, 5px gap — creates the dashed line pattern
          opacity={0.88}
        />
      )}

      {/* ── Waypoint dots along the active path ──────────────────────────────
          First and last points are larger (7px radius) to mark the endpoints clearly.
          Intermediate waypoints are smaller (5px) so the path doesn't look cluttered. */}
      {activePath.map((p, i) => (
        <CircleMarker
          key={i}
          center={[p.y, p.x]}
          radius={i === 0 || i === activePath.length - 1 ? 7 : 5}
          color="#ffd700"
          fillColor="#ffd700"
          fillOpacity={1}
          weight={1.5}
        />
      ))}

      {/* ── Distance label ────────────────────────────────────────────────────
          Shown above the last waypoint once at least 2 points exist.
          Uses a divIcon with a real iconSize so the CSS absolute positioning has a container.
          iconAnchor [60, 46] aligns the bottom-center of the icon with the last waypoint's position. */}
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
          zIndexOffset={2000}  // Render above all other markers
        />
      )}

      {/* ── Permanent location markers (admin-placed) ────────────────────────
          Rendered before user pins so they sit below in the z-stack */}
      {locations.map(loc => (
        <LocationMarker
          key={loc.id}
          location={loc}
          selected={selectedLocation?.id === loc.id}
          onClick={() => onLocationClick?.(loc)}
        />
      ))}

      {/* ── User-placed pins ─────────────────────────────────────────────────
          Rendered last so they appear above location markers */}
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
