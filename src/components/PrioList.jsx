function priorityRank(t) {
  if (t.urgent && t.important) return 0
  if (!t.urgent && t.important) return 1
  if (t.urgent && !t.important) return 2
  return 3
}

function compareNullableDates(a, b) {
  if (a && b) return new Date(a) - new Date(b)
  if (a && !b) return -1
  if (!a && b) return 1
  return 0
}

export default function PrioList({ tasks, onToggleComplete }) {
  const sorted = [...(tasks || [])].sort((a, b) => {
    const r = priorityRank(a) - priorityRank(b)
    if (r !== 0) return r
    const d = Number(a.duration) - Number(b.duration)
    if (d !== 0) return d
    const s = compareNullableDates(a.scheduledAt, b.scheduledAt)
    if (s !== 0) return s
    return compareNullableDates(a.dueAt, b.dueAt)
  })

  if (!sorted.length) {
    return <div className="glass p-6 text-center text-slate-300">No tasks to prioritize</div>
  }

  const badge = (t) => (
    <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 border border-white/20">
      {t.urgent && t.important ? 'U/I' : t.important ? 'I' : t.urgent ? 'U' : 'O'}
    </span>
  )

  return (
    <div className="space-y-2">
      {sorted.map(t => (
        <div key={t.id} className={`glass p-3 flex items-center justify-between hover:bg-white/10 transition-colors ${t.completed ? 'opacity-70' : ''}`}>
          <div className="flex flex-col">
            <div className="font-medium">{t.name}</div>
            <div className="text-xs text-slate-400">{t.type} • {t.duration} min</div>
          </div>
          <div className="flex items-center gap-2">
            {badge(t)}
            <label className="glass px-2 py-1 flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" className="accent-emerald-400" checked={!!t.completed} onChange={() => onToggleComplete?.(t)} />
              <span className="text-xs">Done</span>
            </label>
          </div>
        </div>
      ))}
    </div>
  )
}


