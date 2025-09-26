import { useEffect, useMemo, useState } from 'react'
import TaskForm from './components/TaskForm.jsx'
import TaskList from './components/TaskList.jsx'
import Eisenhower from './components/Eisenhower.jsx'
import PrioList from './components/PrioList.jsx'
import { usePersistentState, useTasksRepository } from './store.js'
import Auth from './components/Auth.jsx'
import { supabase } from './lib/supabase.js'

const TABS = ['Form', 'List', 'Eisenhower', 'Prio']

export default function App() {
  const [activeTab, setActiveTab] = usePersistentState('prioglass.activeTab', 'Form')
  const [session, setSession] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (mounted) setSession(data.session ?? null)
    })()
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess))
    return () => { mounted = false; sub.subscription?.unsubscribe?.() }
  }, [])

  const userId = session?.user?.id
  const { tasks, loading, addTask, updateTask, deleteTask } = useTasksRepository(userId)

  const navTab = (tab) => (
    <button
      key={tab}
      className={`tab ${activeTab === tab ? 'tab-active' : ''}`}
      onClick={() => setActiveTab(tab)}
    >
      {tab}
    </button>
  )

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="p-4">
        <div className="glass p-4 flex items-center justify-between">
          <div className="text-2xl font-semibold tracking-tight">PrioGlass Web</div>
          <div className="flex items-center gap-3">
            {session?.user?.id && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10">{session.user.id}</span>
            )}
            {session && (
              <button className="btn" onClick={() => supabase.auth.signOut()}>Logout</button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 pt-0">
        {!session ? (
          <div className="mt-4"><Auth /></div>
        ) : (
          <>
            <div className="tabs overflow-x-auto no-scrollbar">
              {TABS.map(navTab)}
            </div>
            <div className="mt-4">
              {activeTab === 'Form' && (
                <TaskForm
                  onSave={(task) => { addTask(task); setActiveTab('List') }}
                />
              )}
              {activeTab === 'List' && (
                <TaskList tasks={tasks} onUpdate={updateTask} onDelete={deleteTask} />
              )}
              {activeTab === 'Eisenhower' && (
                <Eisenhower tasks={tasks} />
              )}
              {activeTab === 'Prio' && (
                <PrioList tasks={tasks} />
              )}
            </div>
          </>
        )}
      </main>

      <footer className="p-4 pt-0">
        <div className="glass p-3 text-xs text-slate-300 flex items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} PrioGlass</span>
          <div className="flex items-center gap-2">
            <button className="btn" onClick={async () => {
              const dataStr = JSON.stringify(tasks, null, 2)
              const blob = new Blob([dataStr], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'prioglass-tasks.json'
              a.click()
              URL.revokeObjectURL(url)
            }}>Export</button>
            <label className="btn cursor-pointer">
              <input type="file" accept="application/json" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                try {
                  const text = await file.text()
                  const parsed = JSON.parse(text)
                  if (!Array.isArray(parsed)) { alert('Invalid file'); return }
                  const ok = confirm(`Import ${parsed.length} tasks? This may overwrite tasks with same id.`)
                  if (!ok) return
                  // Use repo bulk import via hidden API by dynamic import to avoid circular
                  const mod = await import('./data/tasksRepo')
                  await mod.bulkImport(parsed)
                  // reload state
                  window.location.reload()
                } catch (err) {
                  alert('Import failed')
                }
                e.target.value = ''
              }} />
              Import
            </label>
          </div>
        </div>
      </footer>
    </div>
  )
}


