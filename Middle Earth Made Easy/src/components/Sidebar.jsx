import { useState, useEffect } from 'react'
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
  selectedPin, newPinPosition,
  onPinSelect, onSave, onDelete, onClose,
  userEmail, onLogout,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [name, setName]         = useState('')
  const [note, setNote]         = useState('')
  const [category, setCategory] = useState('human')
  const [error, setError]       = useState(null)
  const [saving, setSaving]     = useState(false)

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
    </div>
  )
}
