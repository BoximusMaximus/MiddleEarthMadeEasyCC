import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import MapView from '../components/MapView'
import Sidebar from '../components/Sidebar'
import './MapPage.css'

export default function MapPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pins, setPins]                     = useState([])
  const [locations, setLocations]           = useState([])
  const [placementMode, setPlacementMode]   = useState(false)
  const [selectedPin, setSelectedPin]       = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [newPinPosition, setNewPinPosition] = useState(null)

  const isAdmin = user?.app_metadata?.role === 'admin'

  useEffect(() => {
    supabase.from('pins').select('*').then(({ data, error }) => {
      if (!error && data) setPins(data)
    })
    supabase.from('locations').select('*').then(({ data, error }) => {
      if (!error && data) setLocations(data)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  function handleMapClick(latlng) {
    setNewPinPosition(latlng)
    setSelectedPin(null)
    setSelectedLocation(null)
    setPlacementMode(false)
  }

  function handlePinClick(pin) {
    setSelectedPin(pin)
    setNewPinPosition(null)
    setSelectedLocation(null)
    setPlacementMode(false)
  }

  function handleLocationClick(loc) {
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
        onTogglePlacement={() => setPlacementMode(m => !m)}
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
      />
    </div>
  )
}
