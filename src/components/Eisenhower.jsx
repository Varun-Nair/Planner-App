import { useMemo, useState } from 'react'

function quadrantKey(t) {
  if (t.urgent && t.important) return 'UI'
  if (!t.urgent && t.important) return 'I'
  if (t.urgent && !t.important) return 'U'
  return 'O'
}

const LABELS = {
  UI: 'U/I',
  I: 'I',
  U: 'U',
  O: 'Other',
}

export default function Eisenhower({ tasks }) {
  const buckets = useMemo(() => {
    const b = { UI: [], I: [], U: [], O: [] }
    ;(tasks || []).forEach(t => { b[quadrantKey(t)].push(t) })
    return b
  }, [tasks])
  const [selected, setSelected] = useState('')

  const filtered = selected ? buckets[selected] : []

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {['UI', 'I', 'U', 'O'].map(k => (
          <button key={k} className={`glass p-5 text-center hover:bg-white/10 transition-colors ${selected === k ? 'ring-1 ring-cyan-400/40' : ''}`} onClick={() => setSelected(k)}>
            <div className="text-sm text-slate-300">{LABELS[k]}</div>
            <div className="text-2xl font-semibold">{buckets[k].length}</div>
          </button>
        ))}
      </div>
      {selected && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-slate-200">Showing: {LABELS[selected]}</div>
            <button className="btn" onClick={() => setSelected('')}>Clear</button>
          </div>
          {filtered.length === 0 ? (
            <div className="glass p-5 text-center text-slate-300">No tasks</div>
          ) : (
            <div className="space-y-2">
              {filtered.map(t => (
                <div key={t.id} className="glass p-3 hover:bg-white/10 transition-colors">{t.name}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


