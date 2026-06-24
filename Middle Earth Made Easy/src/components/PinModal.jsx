// ⚠️  LEGACY — This component is no longer used anywhere in the app.
// It was the original modal-overlay approach for editing pins.
// The current implementation uses an inline form in Sidebar.jsx instead.
// Kept for reference; safe to delete if the project is cleaned up.
import { useState } from 'react'
import './PinModal.css'

// The old category list used region-based names (Shire, Gondor, Mordor…)
// The current app uses race-based categories (hobbit, human, orc…)
const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'shire',   label: 'The Shire' },
  { value: 'elvish',  label: 'Elvish' },
  { value: 'dwarven', label: 'Dwarven' },
  { value: 'gondor',  label: 'Gondor' },
  { value: 'rohan',   label: 'Rohan' },
  { value: 'mordor',  label: 'Mordor' },
]

// Props: pin (existing pin object or null for new), onSave, onDelete, onClose (callbacks)
export default function PinModal({ pin, onSave, onDelete, onClose }) {
  const [name, setName]         = useState(pin?.name ?? '')
  const [note, setNote]         = useState(pin?.note ?? '')
  const [category, setCategory] = useState(pin?.category ?? 'general')
  const [error, setError]       = useState(null)
  const [saving, setSaving]     = useState(false)

  // Calls the parent's onSave with form data; surfaces any returned error
  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const err = await onSave({ name, note, category })
    setSaving(false)
    if (err) setError(err)
  }

  async function handleDelete() {
    if (!confirm(`Delete pin "${pin.name}"?`)) return
    setSaving(true)
    const err = await onDelete()
    setSaving(false)
    if (err) setError(err)
  }

  return (
    // Clicking the dark overlay (outside the modal) closes it
    <div className="pin-modal-overlay" onClick={onClose}>
      {/* stopPropagation prevents clicks inside the modal from closing it */}
      <div className="pin-modal" onClick={e => e.stopPropagation()}>
        <h2>{pin ? 'Edit Location' : 'New Location'}</h2>
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
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-actions">
            {onDelete && (
              <button
                type="button"
                className="btn-delete"
                onClick={handleDelete}
                disabled={saving}
              >
                Delete
              </button>
            )}
            <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
