// AdminPage — restricted page for placing and managing permanent Middle Earth locations.
// Only users whose Supabase app_metadata.role === 'admin' can access this route (enforced in App.jsx).
// Admins can click the map to place a location, fill in its details, and save it to the `locations` table.
// These locations appear on the map for ALL users (not per-user like pins).
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import MapView from '../components/MapView'
import { CATEGORY_COLORS } from '../components/Sidebar'
import './AdminPage.css'

// Hardcoded catalog of well-known Middle Earth locations.
// Simulates a "3rd-party API" — selecting one pre-fills the location form automatically.
// In a real app this might be fetched from an external Tolkien lore API.
const API_CITIES = [
  { api_city_id: 1, name: 'Hobbiton',     category: 'hobbit', realm: 'The Shire',               location_type: 'Village',           inhabitants: ['Hobbits'],             founded_date: 'TA 1601' },
  { api_city_id: 2, name: 'Minas Tirith', category: 'human',  realm: 'Gondor',                  location_type: 'City',              inhabitants: ['Men'],                  founded_date: 'SA 3320' },
  { api_city_id: 3, name: 'Rivendell',    category: 'elven',  realm: 'Eriador',                 location_type: 'Settlement',        inhabitants: ['Elves'],                founded_date: 'SA 1697' },
  { api_city_id: 4, name: 'Edoras',       category: 'human',  realm: 'Rohan',                   location_type: 'City',              inhabitants: ['Men', 'Rohirrim'],      founded_date: 'TA 2569' },
  { api_city_id: 5, name: 'Isengard',     category: 'orc',    realm: 'Nan Curunír',             location_type: 'Fortress',          inhabitants: ['Uruk-hai', 'Orcs'],     founded_date: 'SA 3320' },
  { api_city_id: 6, name: 'Minas Morgul', category: 'orc',    realm: 'Mordor',                  location_type: 'Fortress',          inhabitants: ['Nazgûl', 'Orcs'],       founded_date: 'SA 3320' },
  { api_city_id: 7, name: 'Lothlórien',   category: 'elven',  realm: 'East of Misty Mountains', location_type: 'Forest realm',      inhabitants: ['Elves', 'Galadhrim'],   founded_date: 'SA 1'    },
  { api_city_id: 8, name: 'Erebor',       category: 'dwarf',  realm: 'Rhovanion',               location_type: 'Mountain fortress', inhabitants: ['Dwarves'],              founded_date: 'TA 1999' },
]

// The categories available for a location — determines the SVG icon shape on the map
const CATEGORIES = [
  { value: 'elven',  label: 'Elven'  },
  { value: 'human',  label: 'Human'  },
  { value: 'orc',    label: 'Orc'    },
  { value: 'dwarf',  label: 'Dwarf'  },
  { value: 'hobbit', label: 'Hobbit' },
  { value: 'goblin', label: 'Goblin' },
  { value: 'beast',  label: 'Beast'  },
]

// Small colored diamond dot shown next to each location in the sidebar list
function LocationDot({ category }) {
  const color = CATEGORY_COLORS[category] ?? '#ffd700'
  return (
    <span className="loc-dot" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
  )
}

export default function AdminPage() {
  const { user } = useAuth()

  // ── Map interaction state ────────────────────────────────────────────────
  const [locations, setLocations]                   = useState([])   // All saved locations
  const [placementMode, setPlacementMode]           = useState(false) // True: next map click sets a position
  const [selectedLocation, setSelectedLocation]     = useState(null)  // Location being edited
  const [newLocationPosition, setNewLocationPosition] = useState(null) // Pending latlng before form submit

  // ── Form field state ─────────────────────────────────────────────────────
  const [name, setName]               = useState('')
  const [category, setCategory]       = useState('human')
  const [realm, setRealm]             = useState('')
  const [locType, setLocType]         = useState('')
  const [inhabitants, setInhabitants] = useState('') // Comma-separated string; split on save
  const [foundedDate, setFoundedDate] = useState('')
  const [description, setDescription] = useState('')
  const [apiCityId, setApiCityId]     = useState('') // Tracks which catalog entry was used (if any)
  const [error, setError]             = useState(null)
  const [saving, setSaving]           = useState(false)

  // showForm: true if either editing an existing location or placing a new one
  const showForm = selectedLocation !== null || newLocationPosition !== null

  // ── Fetch all locations on mount ─────────────────────────────────────────
  useEffect(() => {
    supabase.from('locations').select('*').then(({ data, error }) => {
      if (!error && data) setLocations(data)
    })
  }, [])

  // ── Sync form fields when selection changes ──────────────────────────────
  // Fills the form with the selected location's existing data for editing,
  // or resets all fields when starting a new placement.
  useEffect(() => {
    if (selectedLocation) {
      setName(selectedLocation.name)
      setCategory(selectedLocation.category ?? 'human')
      setRealm(selectedLocation.realm ?? '')
      setLocType(selectedLocation.location_type ?? '')
      setInhabitants((selectedLocation.inhabitants ?? []).join(', '))
      setFoundedDate(selectedLocation.founded_date ?? '')
      setDescription(selectedLocation.description ?? '')
      setApiCityId(selectedLocation.api_city_id ?? '')
    } else if (newLocationPosition) {
      setName(''); setCategory('human'); setRealm(''); setLocType('')
      setInhabitants(''); setFoundedDate(''); setDescription(''); setApiCityId('')
    }
    setError(null)
  }, [selectedLocation, newLocationPosition])

  // ── Map click: capture position and open the new-location form ───────────
  function handleMapClick(latlng) {
    setNewLocationPosition(latlng)
    setSelectedLocation(null)
    setPlacementMode(false)
  }

  // ── Location click: open the edit form for an existing location ──────────
  function handleLocationClick(loc) {
    setSelectedLocation(loc)
    setNewLocationPosition(null)
    setPlacementMode(false)
  }

  function handleClose() {
    setSelectedLocation(null)
    setNewLocationPosition(null)
  }

  // Pre-fills the form from the API_CITIES catalog when the admin selects a city from the dropdown.
  // The api_city_id field is saved to the DB so the data source is traceable.
  function handlePrefill(cityId) {
    const city = API_CITIES.find(c => c.api_city_id === Number(cityId))
    if (!city) return
    setApiCityId(city.api_city_id)
    setName(city.name)
    setCategory(city.category)
    setRealm(city.realm)
    setLocType(city.location_type)
    setInhabitants(city.inhabitants.join(', '))
    setFoundedDate(city.founded_date)
  }

  // ── Save: insert new or update existing location ─────────────────────────
  async function handleSave(e) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError(null)

    // Build the data object — split inhabitants string into an array for JSONB storage
    const fields = {
      name: name.trim(),
      category,
      realm: realm.trim() || null,
      location_type: locType.trim() || null,
      inhabitants: inhabitants.split(',').map(s => s.trim()).filter(Boolean),
      founded_date: foundedDate.trim() || null,
      description: description.trim() || null,
      api_city_id: apiCityId || null,
    }

    if (selectedLocation) {
      // Update existing location
      const { data, error } = await supabase
        .from('locations').update(fields).eq('id', selectedLocation.id).select().single()
      if (error) { setError(error.message); setSaving(false); return }
      setLocations(prev => prev.map(l => l.id === selectedLocation.id ? data : l))
      setSelectedLocation(data)
    } else {
      // Insert new location at the map position clicked by the admin
      const { data, error } = await supabase
        .from('locations')
        .insert({ ...fields, x: newLocationPosition.lng, y: newLocationPosition.lat })
        .select().single()
      if (error) { setError(error.message); setSaving(false); return }
      setLocations(prev => [...prev, data])
      setNewLocationPosition(null)
      setSelectedLocation(data)
    }
    setSaving(false)
  }

  // ── Delete: remove a location permanently ───────────────────────────────
  async function handleDelete() {
    if (!confirm(`Delete "${selectedLocation.name}"?`)) return
    setSaving(true)
    const { error } = await supabase.from('locations').delete().eq('id', selectedLocation.id)
    if (error) { setError(error.message); setSaving(false); return }
    setLocations(prev => prev.filter(l => l.id !== selectedLocation.id))
    setSelectedLocation(null)
    setSaving(false)
  }

  return (
    <div className="admin-page">
      {/* ── Admin sidebar ─────────────────────────────────────────────── */}
      <div className="admin-sidebar">
        <div className="admin-header">
          <span className="admin-title">Admin Panel</span>
          <Link to="/" className="btn-back-map">← Map</Link>
        </div>

        {/* Place Location toggle — enables map-click placement mode */}
        <div className="admin-section">
          <button
            className={`btn-place-location${placementMode ? ' active' : ''}`}
            onClick={() => { setPlacementMode(m => !m); if (!placementMode) handleClose() }}
          >
            {placementMode ? '✕ Cancel' : '+ Place Location'}
          </button>
          {placementMode && (
            <p className="placement-hint">Click anywhere on the map to place a permanent location</p>
          )}
        </div>

        {/* Location form — shown when a position is clicked or an existing location is selected */}
        {showForm && (
          <div className="admin-section admin-form">
            <h3>{selectedLocation ? 'Edit Location' : 'New Location'}</h3>

            {/* Pre-fill dropdown — only shown when creating a new location */}
            {!selectedLocation && (
              <div className="prefill-row">
                <label>Pre-fill from API</label>
                <select defaultValue="" onChange={e => { if (e.target.value) handlePrefill(e.target.value) }}>
                  <option value="" disabled>Select a city…</option>
                  {API_CITIES.map(c => (
                    <option key={c.api_city_id} value={c.api_city_id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={handleSave}>
              <input type="text" placeholder="Name *" value={name} onChange={e => setName(e.target.value)} required autoFocus />
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <input type="text" placeholder="Realm" value={realm} onChange={e => setRealm(e.target.value)} />
              <input type="text" placeholder="Type (City, Fortress, Village…)" value={locType} onChange={e => setLocType(e.target.value)} />
              <input type="text" placeholder="Inhabitants (comma-separated)" value={inhabitants} onChange={e => setInhabitants(e.target.value)} />
              <input type="text" placeholder="Founded date (e.g. TA 1601)" value={foundedDate} onChange={e => setFoundedDate(e.target.value)} />
              <textarea placeholder="Description…" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
              {error && <p className="form-error">{error}</p>}
              <div className="form-actions">
                {selectedLocation && (
                  <button type="button" className="btn-delete" onClick={handleDelete} disabled={saving}>Delete</button>
                )}
                <button type="button" className="btn-cancel" onClick={handleClose} disabled={saving}>Cancel</button>
                <button type="submit" className="btn-save" disabled={saving || !name.trim()}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Scrollable list of all saved locations */}
        <div className="admin-section admin-locations-list">
          <h3>Locations <span className="loc-count">({locations.length})</span></h3>
          {locations.length === 0 ? (
            <p className="no-locations">No permanent locations yet. Use "+ Place Location" to add one.</p>
          ) : (
            <ul className="location-list">
              {locations.map(loc => (
                <li
                  key={loc.id}
                  className={`location-item${selectedLocation?.id === loc.id ? ' selected' : ''}`}
                  onClick={() => handleLocationClick(loc)}
                >
                  <LocationDot category={loc.category} />
                  <span className="loc-item-name">{loc.name}</span>
                  <span className="loc-item-realm">{loc.realm}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Reuse MapView with no pins — admin only manages locations ─── */}
      <MapView
        pins={[]}
        placementMode={placementMode}
        selectedPin={null}
        newPinPosition={newLocationPosition}
        onMapClick={handleMapClick}
        onPinClick={() => {}}
        locations={locations}
        selectedLocation={selectedLocation}
        onLocationClick={handleLocationClick}
      />
    </div>
  )
}
