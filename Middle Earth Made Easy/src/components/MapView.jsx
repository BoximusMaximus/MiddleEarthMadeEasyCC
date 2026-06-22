import { useState, useEffect } from 'react'
import { MapContainer, ImageOverlay, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './MapView.css'
import middleEarthMap from '../assets/middle-earth-map.jpg'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import PinMarker from './PinMarker'
import PinModal from './PinModal'

const IMAGE_WIDTH  = 10000
const IMAGE_HEIGHT = 5455
const bounds = [[0, 0], [IMAGE_HEIGHT, IMAGE_WIDTH]]

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng)
    },
  })
  return null
}

export default function MapView() {
  const { user } = useAuth()
  const [pins, setPins]                   = useState([])
  const [selectedPin, setSelectedPin]     = useState(null)
  const [newPinPosition, setNewPinPosition] = useState(null)

  useEffect(() => {
    loadPins()
  }, [])

  async function loadPins() {
    const { data, error } = await supabase.from('pins').select('*')
    if (!error) setPins(data)
  }

  function handleMapClick(latlng) {
    setNewPinPosition(latlng)
    setSelectedPin(null)
  }

  function handlePinClick(pin) {
    setSelectedPin(pin)
    setNewPinPosition(null)
  }

  function closeModal() {
    setSelectedPin(null)
    setNewPinPosition(null)
  }

  async function handleSave(fields) {
    if (selectedPin) {
      const { data, error } = await supabase
        .from('pins')
        .update(fields)
        .eq('id', selectedPin.id)
        .select()
        .single()
      if (error) return error.message
      setPins(prev => prev.map(p => p.id === selectedPin.id ? data : p))
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
    }
    closeModal()
    return null
  }

  async function handleDelete() {
    const { error } = await supabase.from('pins').delete().eq('id', selectedPin.id)
    if (error) return error.message
    setPins(prev => prev.filter(p => p.id !== selectedPin.id))
    closeModal()
    return null
  }

  return (
    <>
      <MapContainer
        crs={L.CRS.Simple}
        bounds={bounds}
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
        style={{ width: '100vw', height: '100vh', background: '#1a1208' }}
        minZoom={-3}
        maxZoom={0}
        zoomSnap={0.25}
      >
        <ImageOverlay url={middleEarthMap} bounds={bounds} />
        <MapClickHandler onMapClick={handleMapClick} />
        {pins.map(pin => (
          <PinMarker
            key={pin.id}
            pin={pin}
            onClick={() => handlePinClick(pin)}
          />
        ))}
      </MapContainer>

      {(selectedPin || newPinPosition) && (
        <PinModal
          pin={selectedPin}
          onSave={handleSave}
          onDelete={selectedPin ? handleDelete : null}
          onClose={closeModal}
        />
      )}
    </>
  )
}
