import { useState } from 'react'

function formatDate(value) {
  if (!value) return '—'
  try { return new Date(value).toLocaleString() } catch { return value }
}

function TaskItem({ task, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState({ ...task })

  const setField = (k, v) => setDraft(d => ({ ...d, [k]: v }))

  const save = () => {
    const mins = Number(draft.duration)
    if (!draft.name.trim() || !Number.isFinite(mins) || mins <= 0) {
      alert('Please provide a name and a duration > 0')
      return
    }
    onUpdate(task.id, {
      name: draft.name.trim(),
      duration: Number(draft.duration),
      urgent: !!draft.urgent,
      important: !!draft.important,
      scheduledAt: draft.scheduledAt || '',
      dueAt: draft.dueAt || '',
      type: draft.type,
      notes: draft.notes || '',
    })
    setExpanded(false)
  }

  const cancel = () => setDraft({ ...task })

  return (
    <div className="glass p-4">
      <button className="w-full text-left hover:opacity-90 transition-opacity" onClick={() => setExpanded(e => !e)}>
        <div className="font-medium text-base">{task.name || 'Untitled'}</div>
      </button>
      {expanded && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="label">Task Name</div>
              <input className="input mt-2" value={draft.name} onChange={e => setField('name', e.target.value)} />
            </div>
            <div>
              <div className="label">Duration (min)</div>
              <input type="number" min="1" className="input mt-2" value={draft.duration} onChange={e => setField('duration', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="label">Scheduled for</div>
              <input type="datetime-local" className="input mt-2" value={draft.scheduledAt} onChange={e => setField('scheduledAt', e.target.value)} />
            </div>
            <div>
              <div className="label">Due date</div>
              <input type="datetime-local" className="input mt-2" value={draft.dueAt} onChange={e => setField('dueAt', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="glass px-3 py-3 flex items-center gap-3 cursor-pointer select-none hover:bg-white/10 transition-colors">
              <input type="checkbox" className="accent-cyan-400 scale-125" checked={!!draft.urgent} onChange={e => setField('urgent', e.target.checked)} />
              <span>Urgent</span>
            </label>
            <label className="glass px-3 py-3 flex items-center gap-3 cursor-pointer select-none hover:bg-white/10 transition-colors">
              <input type="checkbox" className="accent-emerald-400 scale-125" checked={!!draft.important} onChange={e => setField('important', e.target.checked)} />
              <span>Important</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="label">Task Type</div>
              <select className="input mt-2" value={draft.type} onChange={e => setField('type', e.target.value)}>
                {['Task', 'Issue', 'Project'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <div className="label">Notes</div>
              <input className="input mt-2" value={draft.notes || ''} onChange={e => setField('notes', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary flex-1" onClick={save}>Save</button>
            <button className="btn flex-1" onClick={cancel} type="button">Cancel</button>
            <button className="btn btn-danger" onClick={() => onDelete(task.id)} type="button">Delete</button>
          </div>
          <div className="text-xs text-slate-400">
            <div>Scheduled: {formatDate(task.scheduledAt)}</div>
            <div>Due: {formatDate(task.dueAt)}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TaskList({ tasks, onUpdate, onDelete }) {
  if (!tasks?.length) {
    return (
      <div className="glass p-6 text-center text-slate-300">
        No tasks yet. Add one from the Form tab.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map(t => (
        <TaskItem key={t.id} task={t} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  )
}


