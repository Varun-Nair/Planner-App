import { useMemo, useState } from 'react'

const TYPE_OPTIONS = ['Task', 'Issue', 'Project']

export default function TaskForm({ onSave }) {
  const [name, setName] = useState('')
  const [duration, setDuration] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [important, setImportant] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [type, setType] = useState('Task')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!name.trim()) e.name = 'Task name is required'
    const mins = Number(duration)
    if (!Number.isFinite(mins) || mins <= 0) e.duration = 'Duration must be > 0'
    if (!TYPE_OPTIONS.includes(type)) e.type = 'Select a type'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    if (!validate()) return
    onSave({
      name: name.trim(),
      duration: Number(duration),
      urgent,
      important,
      scheduledAt,
      dueAt,
      type,
      notes: notes.trim(),
    })
    setName('')
    setDuration('')
    setUrgent(false)
    setImportant(false)
    setScheduledAt('')
    setDueAt('')
    setType('Task')
    setNotes('')
    setErrors({})
  }

  return (
    <form onSubmit={handleSubmit} className="glass p-5 space-y-5">
      <div>
        <div className="text-sm font-semibold text-white">Task Name</div>
        <input className="input mt-2" placeholder="e.g., Plan sprint" value={name} onChange={e => setName(e.target.value)} required />
        {errors.name && <p className="text-rose-300 text-sm mt-1">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="label">Duration (minutes)</div>
          <input type="number" min="1" inputMode="numeric" className="input mt-2" placeholder="30" value={duration} onChange={e => setDuration(e.target.value)} required />
          {errors.duration && <p className="text-rose-300 text-sm mt-1">{errors.duration}</p>}
        </div>
        <div>
          <div className="label">Task Type</div>
          <select className="input mt-2" value={type} onChange={e => setType(e.target.value)} required>
            {TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {errors.type && <p className="text-rose-300 text-sm mt-1">{errors.type}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="label">Scheduled for</div>
          <input type="datetime-local" className="input mt-2" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
        </div>
        <div>
          <div className="label">Due date</div>
          <input type="datetime-local" className="input mt-2" value={dueAt} onChange={e => setDueAt(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="glass px-3 py-3 flex items-center gap-3 cursor-pointer select-none hover:bg-white/10 transition-colors">
          <input type="checkbox" className="accent-cyan-400 scale-125" checked={urgent} onChange={e => setUrgent(e.target.checked)} />
          <span className="text-slate-200">Urgent</span>
        </label>
        <label className="glass px-3 py-3 flex items-center gap-3 cursor-pointer select-none hover:bg-white/10 transition-colors">
          <input type="checkbox" className="accent-emerald-400 scale-125" checked={important} onChange={e => setImportant(e.target.checked)} />
          <span className="text-slate-200">Important</span>
        </label>
      </div>

      <div>
        <div className="label">Notes</div>
        <textarea className="input mt-2 min-h-[92px]" placeholder="Optional details" value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary w-full">Save Task</button>
      </div>
    </form>
  )
}


