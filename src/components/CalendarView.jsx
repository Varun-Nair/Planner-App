import { useMemo, useState } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = {}
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

export default function CalendarView({ tasks, onUpdate, onDelete }) {
  const events = useMemo(() => {
    return (tasks || [])
      .filter(t => !!t.scheduledAt)
      .map(t => {
        const start = new Date(t.scheduledAt)
        const end = new Date(new Date(t.scheduledAt).getTime() + Math.max(15, Number(t.duration || 30)) * 60000)
        return {
          id: t.id,
          title: t.name || 'Untitled',
          start,
          end,
          resource: t,
        }
      })
  }, [tasks])

  const [selected, setSelected] = useState(null)
  const [draft, setDraft] = useState(null)
  const close = () => { setSelected(null); setDraft(null) }
  const setField = (k, v) => setDraft(d => ({ ...d, [k]: v }))

  return (
    <div className="glass p-2">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 520 }}
        onSelectEvent={(ev) => { setSelected(ev.resource); setDraft({ ...ev.resource }) }}
      />

      {selected && draft && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-50" onClick={close}>
          <div className="glass w-full max-w-lg p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="text-lg font-semibold">Edit Task</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="label">Name</div>
                <input className="input mt-2" value={draft.name} onChange={e => setField('name', e.target.value)} />
              </div>
              <div>
                <div className="label">Duration (min)</div>
                <input type="number" min="1" className="input mt-2" value={draft.duration} onChange={e => setField('duration', e.target.value)} />
              </div>
              <div>
                <div className="label">Scheduled</div>
                <input type="datetime-local" className="input mt-2" value={draft.scheduledAt || ''} onChange={e => setField('scheduledAt', e.target.value)} />
              </div>
              <div>
                <div className="label">Due</div>
                <input type="datetime-local" className="input mt-2" value={draft.dueAt || ''} onChange={e => setField('dueAt', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="glass px-3 py-3 flex items-center gap-3 cursor-pointer select-none hover:bg-white/10 transition-colors">
                  <input type="checkbox" className="accent-emerald-400 scale-125" checked={!!draft.completed} onChange={e => setField('completed', e.target.checked)} />
                  <span>Completed</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary flex-1" onClick={async () => { await onUpdate(draft.id, { ...draft }); close() }}>Save</button>
              <button className="btn flex-1" onClick={close}>Cancel</button>
              <button className="btn btn-danger" onClick={async () => { await onDelete(draft.id); close() }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


