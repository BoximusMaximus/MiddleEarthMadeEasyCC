// MapPage — the main application view. Owns ALL shared state and is the single source of truth.
// It fetches data, handles every user action, and passes data + callbacks down to child components.
// Neither Sidebar nor MapView hold their own data; they only display what MapPage gives them.
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import MapView from '../components/MapView'
import Sidebar from '../components/Sidebar'
import './MapPage.css'

// Scale factor determined by manual measurement: two reference points placed 250 miles apart
// in the lore were found to be exactly 1000 pixels apart on the image (10000 × 5455 px).
// This constant converts Euclidean pixel distance to miles for the distance measurement tool.
const MILES_PER_PIXEL = 0.25

// Calculates the total length of a multi-point path in miles.
// points: array of { x, y } objects (pixel coordinates on the map image).
// Iterates each consecutive pair, computes straight-line (Euclidean) pixel distance,
// sums them, then multiplies by the scale factor.
function pathMiles(points) {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    total += Math.sqrt(dx * dx + dy * dy)
  }
  return total * MILES_PER_PIXEL
}

export default function MapPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // ── Data fetched from Supabase ───────────────────────────────────────────
  const [pins, setPins]             = useState([])   // User's own placeable pins
  const [locations, setLocations]   = useState([])   // Admin-placed permanent locations
  const [savedPaths, setSavedPaths] = useState([])   // User's saved measurement paths

  // ── UI mode flags ────────────────────────────────────────────────────────
  const [placementMode, setPlacementMode] = useState(false) // True: map clicks place a new pin
  const [measureMode, setMeasureMode]     = useState(false) // True: map clicks add path waypoints

  // ── Selection state ──────────────────────────────────────────────────────
  const [selectedPin, setSelectedPin]           = useState(null) // Pin being viewed/edited in sidebar
  const [selectedLocation, setSelectedLocation] = useState(null) // Location info shown in sidebar
  const [newPinPosition, setNewPinPosition]     = useState(null) // Pending latlng for the new-pin form
  const [selectedPath, setSelectedPath]         = useState(null) // Saved path highlighted on the map

  // activePath: array of { x, y } waypoints for the path currently being drawn (max 100 points)
  const [activePath, setActivePath] = useState([])

  // Admin flag — checked via app_metadata, which is server-set and cannot be edited by users
  const isAdmin = user?.app_metadata?.role === 'admin'

  // Recompute total miles only when the activePath array changes (avoids recalculating on every render)
  const activePathMiles = useMemo(() => pathMiles(activePath), [activePath])

  // ── Initial data fetch ───────────────────────────────────────────────────
  // Runs once on mount. Loads pins, global locations, and saved paths in parallel.
  useEffect(() => {
    supabase.from('pins').select('*').then(({ data, error }) => {
      if (!error && data) setPins(data)
    })
    supabase.from('locations').select('*').then(({ data, error }) => {
      if (!error && data) setLocations(data)
    })
    supabase.from('paths').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (!error && data) setSavedPaths(data)
    })
  }, [])

  // ── Auth ─────────────────────────────────────────────────────────────────

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // ── Mode toggles ─────────────────────────────────────────────────────────

  // Entering measure mode clears any active pin placement to avoid conflicting modes
  function handleToggleMeasure() {
    setMeasureMode(m => {
      if (!m) {
        setPlacementMode(false)
        setNewPinPosition(null)
        setSelectedPin(null)
        setSelectedLocation(null)
      }
      return !m
    })
  }

  function handleTogglePlacement() {
    setPlacementMode(m => !m)
    setMeasureMode(false)
  }

  // ── Measurement path actions ─────────────────────────────────────────────

  // Appends a waypoint; silently ignores clicks when the 100-point limit is reached
  function addPathPoint(x, y) {
    if (activePath.length >= 100) return
    setActivePath(prev => [...prev, { x, y }])
  }

  // ── Map click handler ────────────────────────────────────────────────────
  // Dispatches the click to the correct action based on current mode.
  // latlng is Leaflet's { lat, lng } — in CRS.Simple, lat = y pixels, lng = x pixels.
  function handleMapClick(latlng) {
    if (measureMode) { addPathPoint(latlng.lng, latlng.lat); return }
    // In placement mode: record the position and open the new-pin form in the sidebar
    setNewPinPosition(latlng)
    setSelectedPin(null)
    setSelectedLocation(null)
    setPlacementMode(false)
  }

  // ── Pin click handler ────────────────────────────────────────────────────
  // In measure mode: snaps a waypoint to the pin's stored coordinates.
  // Otherwise: opens the pin's edit form in the sidebar.
  function handlePinClick(pin) {
    if (measureMode) { addPathPoint(pin.x, pin.y); return }
    setSelectedPin(pin)
    setNewPinPosition(null)
    setSelectedLocation(null)
    setPlacementMode(false)
  }

  // ── Location click handler ───────────────────────────────────────────────
  // In measure mode: snaps a waypoint to the location's coordinates.
  // Otherwise: shows the location detail panel in the sidebar.
  function handleLocationClick(loc) {
    if (measureMode) { addPathPoint(loc.x, loc.y); return }
    setSelectedLocation(loc)
    setSelectedPin(null)
    setNewPinPosition(null)
    setPlacementMode(false)
  }

  function handleClose() {
    setSelectedPin(null)
    setNewPinPosition(null)
  }

  function handleLocationClose() {
    setSelectedLocation(null)
  }

  // Removes the most recently added waypoint (undo last click in measure mode)
  function handleUndoPoint() {
    setActivePath(prev => prev.slice(0, -1))
  }

  // Clears the entire active path so the user can start fresh
  function handleClearPath() {
    setActivePath([])
  }

  // ── Path CRUD ────────────────────────────────────────────────────────────

  // Saves the current active path to Supabase, then clears the drawing.
  // Returns an error string on failure, or null on success (caller shows the error).
  async function handleSavePath(name) {
    if (!user || activePath.length < 2) return 'Need at least 2 points'
    const { data, error } = await supabase
      .from('paths')
      .insert({
        user_id: user.id,
        name,
        points: activePath,                                    // Stored as JSONB in Postgres
        total_miles: parseFloat(activePathMiles.toFixed(2)),
      })
      .select()
      .single()
    if (error) return error.message
    // Prepend so the newest path appears at the top of the list
    setSavedPaths(prev => [data, ...prev])
    setActivePath([])
    return null
  }

  // Deletes a saved path by id and removes it from local state.
  // Deselects if the deleted path was the one highlighted on the map.
  async function handleDeletePath(pathId) {
    const { error } = await supabase.from('paths').delete().eq('id', pathId)
    if (error) return error.message
    setSavedPaths(prev => prev.filter(p => p.id !== pathId))
    if (selectedPath?.id === pathId) setSelectedPath(null)
    return null
  }

  // ── Pin CRUD ─────────────────────────────────────────────────────────────

  // Handles both creating a new pin (newPinPosition set) and updating an existing one (selectedPin set)
  async function handleSave(fields) {
    if (!user) return 'Not authenticated'
    if (selectedPin) {
      // Update existing pin in Supabase, then refresh it in local state
      const { data, error } = await supabase
        .from('pins')
        .update(fields)
        .eq('id', selectedPin.id)
        .select()
        .single()
      if (error) return error.message
      setPins(prev => prev.map(p => p.id === selectedPin.id ? data : p))
      setSelectedPin(data)
    } else {
      // Insert a new pin at the position the user clicked on the map
      const { data, error } = await supabase
        .from('pins')
        .insert({
          ...fields,
          user_id: user.id,
          x: newPinPosition.lng,   // lng = x pixel coordinate in CRS.Simple
          y: newPinPosition.lat,   // lat = y pixel coordinate in CRS.Simple
        })
        .select()
        .single()
      if (error) return error.message
      setPins(prev => [...prev, data])
      setNewPinPosition(null)
      setSelectedPin(data)
    }
    return null
  }

  // Deletes the currently selected pin from the database and removes it from local state
  async function handleDelete() {
    const { error } = await supabase.from('pins').delete().eq('id', selectedPin.id)
    if (error) return error.message
    setPins(prev => prev.filter(p => p.id !== selectedPin.id))
    setSelectedPin(null)
    setNewPinPosition(null)
    return null
  }

  return (
    <div className="map-page">
      {/* Sidebar receives all state and callbacks — it owns no data of its own */}
      <Sidebar
        pins={pins}
        placementMode={placementMode}
        onTogglePlacement={handleTogglePlacement}
        selectedPin={selectedPin}
        newPinPosition={newPinPosition}
        selectedLocation={selectedLocation}
        onPinSelect={handlePinClick}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={handleClose}
        onLocationClose={handleLocationClose}
        userEmail={user?.email}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        measureMode={measureMode}
        onToggleMeasure={handleToggleMeasure}
        activePath={activePath}
        activePathMiles={activePathMiles}
        onUndoPoint={handleUndoPoint}
        onClearPath={handleClearPath}
        onSavePath={handleSavePath}
        savedPaths={savedPaths}
        selectedPath={selectedPath}
        onSelectPath={setSelectedPath}
        onDeletePath={handleDeletePath}
      />

      {/* MapView receives the same data plus click handlers */}
      <MapView
        pins={pins}
        placementMode={placementMode}
        selectedPin={selectedPin}
        newPinPosition={newPinPosition}
        onMapClick={handleMapClick}
        onPinClick={handlePinClick}
        locations={locations}
        selectedLocation={selectedLocation}
        onLocationClick={handleLocationClick}
        measureMode={measureMode}
        activePath={activePath}
        activePathMiles={activePathMiles}
        savedPaths={savedPaths}
        selectedPath={selectedPath}
        onSelectPath={setSelectedPath}
      />
    </div>
  )
}
