import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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

function formatDate(value) {
  if (!value) return '—'
  try { return new Date(value).toLocaleString() } catch { return value }
}

export default function PrioList({ tasks, onToggleComplete }) {
  const [openIds, setOpenIds] = useState(new Set())
  const [dragId, setDragId] = useState(null)
  const [orderIds, setOrderIds] = useState([])
  const [orderKey, setOrderKey] = useState('prioglass.prioOrder')
  const toggleOpen = (id) => {
    setOpenIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  const base = [...(tasks || []).filter(t => !t.completed)].sort((a, b) => {
    const r = priorityRank(a) - priorityRank(b)
    if (r !== 0) return r
    const d = Number(a.duration) - Number(b.duration)
    if (d !== 0) return d
    const s = compareNullableDates(a.scheduledAt, b.scheduledAt)
    if (s !== 0) return s
    return compareNullableDates(a.dueAt, b.dueAt)
  })

  // Per-user ordering key
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const key = user?.id ? `prioglass.prioOrder.${user.id}` : 'prioglass.prioOrder'
      setOrderKey(key)
    })()
  }, [])

  // Initialize and maintain orderIds based on saved preference and current base list
  useEffect(() => {
    const baseIds = base.map(t => t.id)
    let saved = []
    try {
      const raw = localStorage.getItem(orderKey)
      if (raw) saved = JSON.parse(raw)
    } catch {}
    const filteredSaved = saved.filter(id => baseIds.includes(id))
    const merged = Array.from(new Set([...filteredSaved, ...baseIds]))
    setOrderIds(merged)
  }, [orderKey, base.map(t => t.id).join(',')])

  useEffect(() => {
    if (!orderIds?.length) return
    try { localStorage.setItem(orderKey, JSON.stringify(orderIds)) } catch {}
  }, [orderKey, orderIds])

  const byId = new Map(base.map(t => [t.id, t]))
  const sorted = orderIds.map(id => byId.get(id)).filter(Boolean)

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
        <div
          key={t.id}
          className={`glass p-3 hover:bg-white/10 transition-colors ${t.completed ? 'opacity-70' : ''} cursor-pointer`}
          onClick={() => toggleOpen(t.id)}
          draggable
          onDragStart={() => setDragId(t.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (!dragId || dragId === t.id) return
            const from = orderIds.indexOf(dragId)
            const to = orderIds.indexOf(t.id)
            if (from === -1 || to === -1) return
            const next = [...orderIds]
            next.splice(from, 1)
            next.splice(to, 0, dragId)
            setOrderIds(next)
            setDragId(null)
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-slate-400">{t.type} • {t.duration} min</div>
            </div>
            <div className="flex items-center gap-2">
              {badge(t)}
              <label className="glass px-2 py-1 flex items-center gap-2 cursor-pointer select-none" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" className="accent-emerald-400" checked={!!t.completed} onChange={() => onToggleComplete?.(t)} />
                <span className="text-xs">Done</span>
              </label>
            </div>
          </div>
          {openIds.has(t.id) && (
            <div className="mt-2 text-xs text-slate-300">
              <div>Scheduled: {formatDate(t.scheduledAt)}</div>
              {t.notes ? (
                <div className="mt-1">Notes: {t.notes}</div>
              ) : (
                <div className="mt-1 text-slate-400">Notes: —</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}


