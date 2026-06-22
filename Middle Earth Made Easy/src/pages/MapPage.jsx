import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import MapView from '../components/MapView'
import Sidebar from '../components/Sidebar'
import './MapPage.css'

const MILES_PER_PIXEL = 0.25

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
  const [pins, setPins]                         = useState([])
  const [locations, setLocations]               = useState([])
  const [placementMode, setPlacementMode]       = useState(false)
  const [selectedPin, setSelectedPin]           = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [newPinPosition, setNewPinPosition]     = useState(null)
  const [measureMode, setMeasureMode]           = useState(false)
  const [activePath, setActivePath]             = useState([])
  const [savedPaths, setSavedPaths]             = useState([])
  const [selectedPath, setSelectedPath]         = useState(null)

  const isAdmin = user?.app_metadata?.role === 'admin'
  const activePathMiles = useMemo(() => pathMiles(activePath), [activePath])

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

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

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

  function addPathPoint(x, y) {
    if (activePath.length >= 100) return
    setActivePath(prev => [...prev, { x, y }])
  }

  function handleMapClick(latlng) {
    if (measureMode) { addPathPoint(latlng.lng, latlng.lat); return }
    setNewPinPosition(latlng)
    setSelectedPin(null)
    setSelectedLocation(null)
    setPlacementMode(false)
  }

  function handlePinClick(pin) {
    if (measureMode) { addPathPoint(pin.x, pin.y); return }
    setSelectedPin(pin)
    setNewPinPosition(null)
    setSelectedLocation(null)
    setPlacementMode(false)
  }

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

  function handleUndoPoint() {
    setActivePath(prev => prev.slice(0, -1))
  }

  function handleClearPath() {
    setActivePath([])
  }

  async function handleSavePath(name) {
    if (!user || activePath.length < 2) return 'Need at least 2 points'
    const { data, error } = await supabase
      .from('paths')
      .insert({
        user_id: user.id,
        name,
        points: activePath,
        total_miles: parseFloat(activePathMiles.toFixed(2)),
      })
      .select()
      .single()
    if (error) return error.message
    setSavedPaths(prev => [data, ...prev])
    setActivePath([])
    return null
  }

  async function handleDeletePath(pathId) {
    const { error } = await supabase.from('paths').delete().eq('id', pathId)
    if (error) return error.message
    setSavedPaths(prev => prev.filter(p => p.id !== pathId))
    if (selectedPath?.id === pathId) setSelectedPath(null)
    return null
  }

  async function handleSave(fields) {
    if (!user) return 'Not authenticated'
    if (selectedPin) {
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
      const { data, error } = await supabase
        .from('pins')
        .insert({
          ...fields,
          user_id: user.id,
          x: newPinPosition.lng,
          y: newPinPosition.lat,
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
