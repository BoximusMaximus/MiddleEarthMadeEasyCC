import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Sidebar.css'

const CATEGORIES = [
  { value: 'elven',  label: 'Elven' },
  { value: 'human',  label: 'Human' },
  { value: 'orc',    label: 'Orc' },
  { value: 'dwarf',  label: 'Dwarf' },
  { value: 'hobbit', label: 'Hobbit' },
  { value: 'goblin', label: 'Goblin' },
  { value: 'beast',  label: 'Beast' },
]

export const CATEGORY_COLORS = {
  elven:  '#4a9e4a',
  human:  '#e8e8e8',
  orc:    '#cc3333',
  dwarf:  '#8a8070',
  hobbit: '#5b8dd9',
  goblin: '#c8c820',
  beast:  '#e07820',
}

function PinDot({ category }) {
  const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.human
  return (
    <span
      className="pin-dot"
      style={{ background: color, boxShadow: `0 0 4px ${color}` }}
    />
  )
}

export default function Sidebar({
  pins, placementMode, onTogglePlacement,
  selectedPin, newPinPosition, selectedLocation,
  onPinSelect, onSave, onDelete, onClose, onLocationClose,
  userEmail, onLogout, isAdmin,
  measureMode, onToggleMeasure,
  activePath, activePathMiles, onUndoPoint, onClearPath, onSavePath,
  savedPaths, selectedPath, onSelectPath, onDeletePath,
}) {
  const [collapsed, setCollapsed]     = useState(false)
  const [name, setName]               = useState('')
  const [note, setNote]               = useState('')
  const [category, setCategory]       = useState('human')
  const [error, setError]             = useState(null)
  const [saving, setSaving]           = useState(false)
  const [pathName, setPathName]       = useState('')
  const [pathSaveError, setPathSaveError] = useState(null)
  const [pathSaving, setPathSaving]   = useState(false)

  const showForm = selectedPin !== null || newPinPosition !== null

  useEffect(() => {
    if (selectedPin) {
      setName(selectedPin.name)
      setNote(selectedPin.note ?? '')
      setCategory(selectedPin.category ?? 'human')
    } else if (newPinPosition) {
      setName('')
      setNote('')
      setCategory('human')
    }
    setError(null)
  }, [selectedPin, newPinPosition])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const err = await onSave({ name, note, category })
    setSaving(false)
    if (err) setError(err)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${selectedPin.name}"?`)) return
    setSaving(true)
    const err = await onDelete()
    setSaving(false)
    if (err) setError(err)
  }

  async function handleSavePathSubmit(e) {
    e.preventDefault()
    if (!pathName.trim()) return
    setPathSaving(true)
    setPathSaveError(null)
    const err = await onSavePath(pathName.trim())
    setPathSaving(false)
    if (err) {
      setPathSaveError(err)
    } else {
      setPathName('')
    }
  }

  if (collapsed) {
    return (
      <div className="sidebar sidebar-collapsed">
        <button className="sidebar-toggle" onClick={() => setCollapsed(false)} title="Open sidebar">
          ›
        </button>
      </div>
    )
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Middle Earth</span>
        <button className="sidebar-toggle" onClick={() => setCollapsed(true)} title="Collapse">
          ‹
        </button>
      </div>

      <div className="sidebar-user">
        <span className="sidebar-email">{userEmail}</span>
        <button className="sidebar-logout" onClick={onLogout}>Logout</button>
      </div>

      {/* Place Pin */}
      <div className="sidebar-section">
        <button
          className={`btn-place-pin${placementMode ? ' active' : ''}`}
          onClick={onTogglePlacement}
        >
          {placementMode ? '✕ Cancel' : '+ Place Pin'}
        </button>
        {placementMode && (
          <p className="placement-hint">Click anywhere on the map to place a pin</p>
        )}
      </div>

      {/* Measure Distance */}
      <div className="sidebar-section">
        <button
          className={`btn-place-pin${measureMode ? ' active' : ''}`}
          onClick={onToggleMeasure}
        >
          {measureMode ? '✕ Stop Measuring' : '↔ Measure Distance'}
        </button>

        {measureMode && (
          <div className="measure-controls">
            {activePath.length === 0 && (
              <p className="placement-hint">Click anywhere on the map to add points</p>
            )}

            {activePath.length >= 1 && (
              <div className="measure-status">
                <span className="measure-point-count">
                  {activePath.length} / 100 pts
                </span>
                {activePath.length >= 2 && (
                  <span className="measure-miles-active">
                    {activePathMiles.toFixed(1)} mi
                  </span>
                )}
              </div>
            )}

            {activePath.length >= 1 && (
              <div className="measure-actions">
                <button className="btn-measure-action" onClick={onUndoPoint}>
                  ↩ Undo
                </button>
                <button className="btn-measure-action" onClick={onClearPath}>
                  ✕ Clear
                </button>
              </div>
            )}

            {activePath.length >= 2 && (
              <form className="path-save-form" onSubmit={handleSavePathSubmit}>
                <input
                  type="text"
                  placeholder="Name this path…"
                  value={pathName}
                  onChange={e => setPathName(e.target.value)}
                  maxLength={80}
                />
                {pathSaveError && <p className="form-error">{pathSaveError}</p>}
                <button
                  type="submit"
                  className="btn-save"
                  disabled={pathSaving || !pathName.trim()}
                >
                  {pathSaving ? 'Saving…' : 'Save Path'}
                </button>
              </form>
            )}

            {activePath.length >= 100 && (
              <p className="placement-hint" style={{ color: '#cc7722' }}>
                Maximum 100 points reached
              </p>
            )}
          </div>
        )}
      </div>

      {/* Saved paths list */}
      {savedPaths.length > 0 && (
        <div className="sidebar-section sidebar-paths">
          <h3>My Paths <span className="pin-count">({savedPaths.length})</span></h3>
          <ul className="path-list">
            {savedPaths.map(path => (
              <li
                key={path.id}
                className={`path-item${selectedPath?.id === path.id ? ' selected' : ''}`}
                onClick={() => onSelectPath(selectedPath?.id === path.id ? null : path)}
              >
                <div className="path-item-main">
                  <span className="path-item-name">{path.name}</span>
                  <span className="path-item-dist">
                    {path.total_miles?.toFixed(1)} mi
                  </span>
                </div>
                <div className="path-item-sub">
                  <span className="path-item-points">{path.points?.length} pts</span>
                  <button
                    className="btn-path-delete"
                    title="Delete path"
                    onClick={e => { e.stopPropagation(); onDeletePath(path.id) }}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pin form */}
      {showForm && (
        <div className="sidebar-section sidebar-form">
          <h3>{selectedPin ? 'Edit Pin' : 'New Pin'}</h3>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Location name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <textarea
              placeholder="Notes about this location..."
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={4}
            />
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              {selectedPin && (
                <button type="button" className="btn-delete" onClick={handleDelete} disabled={saving}>
                  Delete
                </button>
              )}
              <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={saving || !name.trim()}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Location info */}
      {selectedLocation && !showForm && (
        <div className="sidebar-section sidebar-location-info">
          <div className="location-info-header">
            <h3>{selectedLocation.name}</h3>
            <button className="btn-close-info" onClick={onLocationClose} title="Close">✕</button>
          </div>
          <dl className="location-details">
            {selectedLocation.realm && (
              <><dt>Realm</dt><dd>{selectedLocation.realm}</dd></>
            )}
            {selectedLocation.location_type && (
              <><dt>Type</dt><dd>{selectedLocation.location_type}</dd></>
            )}
            {selectedLocation.inhabitants?.length > 0 && (
              <><dt>Inhabitants</dt><dd>{selectedLocation.inhabitants.join(', ')}</dd></>
            )}
            {selectedLocation.founded_date && (
              <><dt>Founded</dt><dd>{selectedLocation.founded_date}</dd></>
            )}
          </dl>
          {selectedLocation.description && (
            <p className="location-description">{selectedLocation.description}</p>
          )}
        </div>
      )}

      {/* My Pins */}
      <div className="sidebar-section sidebar-pins">
        <h3>My Pins <span className="pin-count">({pins.length})</span></h3>
        {pins.length === 0 ? (
          <p className="no-pins">No pins yet. Click "Place Pin" to add one.</p>
        ) : (
          <ul className="pin-list">
            {pins.map(pin => (
              <li
                key={pin.id}
                className={`pin-item${selectedPin?.id === pin.id ? ' selected' : ''}`}
                onClick={() => onPinSelect(pin)}
              >
                <PinDot category={pin.category} />
                <span className="pin-item-name">{pin.name}</span>
                <span className="pin-item-category">{pin.category}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isAdmin && (
        <div className="sidebar-section sidebar-admin-link">
          <Link to="/admin" className="btn-admin-panel">⚙ Admin Panel</Link>
        </div>
      )}
    </div>
  )
}
