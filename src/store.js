import { useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase.js'
import { listAll as repoListAll, addTask as repoAddTask, updateTask as repoUpdateTask, deleteTask as repoDeleteTask } from './data/tasksRepo.js'

export function usePersistentState(key, initialValue) {
  const isFirstLoadRef = useRef(true)
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw != null ? JSON.parse(raw) : initialValue
    } catch (err) {
      console.warn('usePersistentState: failed to parse localStorage for', key, err)
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch (err) {
      console.warn('usePersistentState: failed to write localStorage for', key, err)
    }
  }, [key, state])

  // Sync across tabs (best-effort)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === key && e.newValue != null) {
        try {
          const next = JSON.parse(e.newValue)
          setState(next)
        } catch {}
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  // Avoid double-write on first mount if initialValue is used
  useEffect(() => {
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false
    }
  }, [])

  return [state, setState]
}

export function generateId(prefix = 't') {
  const random = Math.random().toString(36).slice(2)
  return `${prefix}_${Date.now().toString(36)}_${random}`
}

// One-time migration from localStorage to Dexie. Safe to call multiple times.
export async function migrateLocalStorageToIndexedDB() {
  try {
    const migratedFlag = localStorage.getItem('prioglass.migratedToIndexedDB')
    if (migratedFlag === 'true') return
    const raw = localStorage.getItem('prioglass.tasks')
    if (!raw) {
      localStorage.setItem('prioglass.migratedToIndexedDB', 'true')
      return
    }
    const tasks = JSON.parse(raw)
    if (Array.isArray(tasks) && tasks.length > 0) {
      // Ensure IDs are strings
      const normalized = tasks.map(t => ({ ...t, id: String(t.id) }))
      await repoBulkImport(normalized)
    }
    localStorage.setItem('prioglass.migratedToIndexedDB', 'true')
  } catch (err) {
    console.warn('Migration failed', err)
  }
}

// React-friendly repository hook maintaining tasks array in state while persisting to Supabase
export function useTasksRepository(userId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      if (!userId) { setTasks([]); setLoading(false); return }
      const all = await repoListAll(userId)
      setTasks(all)
      setLoading(false)
    })()
  }, [userId])

  const addTask = async (partial) => {
    const task = {
      name: '',
      duration: 0,
      urgent: false,
      important: false,
      scheduledAt: '',
      dueAt: '',
      type: 'Task',
      notes: '',
      ...partial,
    }
    const created = await repoAddTask(userId, task)
    setTasks(prev => [created, ...prev])
  }

  const updateTask = async (id, updates) => {
    const existing = tasks.find(t => t.id === id)
    if (!existing) return
    const updated = await repoUpdateTask(userId, { ...existing, ...updates })
    setTasks(prev => prev.map(t => t.id === id ? updated : t))
  }

  const deleteTask = async (id) => {
    await repoDeleteTask(userId, id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const reload = async () => {
    if (!userId) { setTasks([]); return }
    const all = await repoListAll(userId)
    setTasks(all)
  }

  // Realtime sync for this user
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, async (payload) => {
        const row = payload.new || payload.old
        if (!row || row.user_id !== userId) return
        // Simple strategy: refetch
        try { const all = await repoListAll(userId); setTasks(all) } catch {}
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return { tasks, loading, addTask, updateTask, deleteTask, reload }
}


