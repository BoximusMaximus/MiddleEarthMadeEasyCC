import { useState } from 'react'
import './PinModal.css'

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'shire',   label: 'The Shire' },
  { value: 'elvish',  label: 'Elvish' },
  { value: 'dwarven', label: 'Dwarven' },
  { value: 'gondor',  label: 'Gondor' },
  { value: 'rohan',   label: 'Rohan' },
  { value: 'mordor',  label: 'Mordor' },
]

export default function PinModal({ pin, onSave, onDelete, onClose }) {
  const [name, setName]         = useState(pin?.name ?? '')
  const [note, setNote]         = useState(pin?.note ?? '')
  const [category, setCategory] = useState(pin?.category ?? 'general')
  const [error, setError]       = useState(null)
  const [saving, setSaving]     = useState(false)

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
    <div className="pin-modal-overlay" onClick={onClose}>
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
