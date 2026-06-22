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
  const [placementMode, setPlacementMode]   = useState(false)
  const [selectedPin, setSelectedPin]       = useState(null)
  const [newPinPosition, setNewPinPosition] = useState(null)

  useEffect(() => {
    supabase.from('pins').select('*').then(({ data, error }) => {
      if (!error && data) setPins(data)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  function handleMapClick(latlng) {
    setNewPinPosition(latlng)
    setSelectedPin(null)
    setPlacementMode(false)
  }

  function handlePinClick(pin) {
    setSelectedPin(pin)
    setNewPinPosition(null)
    setPlacementMode(false)
  }

  function handleClose() {
    setSelectedPin(null)
    setNewPinPosition(null)
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
        onPinSelect={handlePinClick}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={handleClose}
        userEmail={user?.email}
        onLogout={handleLogout}
      />
      <MapView
        pins={pins}
        placementMode={placementMode}
        selectedPin={selectedPin}
        newPinPosition={newPinPosition}
        onMapClick={handleMapClick}
        onPinClick={handlePinClick}
      />
    </div>
  )
}
