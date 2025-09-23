import { useEffect, useRef, useState } from 'react'
import { listAll as repoListAll, add as repoAdd, update as repoUpdate, remove as repoRemove, bulkImport as repoBulkImport } from './data/tasksRepo'

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

// React-friendly repository hook maintaining tasks array in state while persisting to Dexie
export function useTasksRepository(userId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      await migrateLocalStorageToIndexedDB()
      const all = await repoListAll(userId)
      setTasks(all)
      setLoading(false)
    })()
  }, [userId])

  const addTask = async (partial) => {
    const now = new Date().toISOString()
    const task = {
      id: generateId('task'),
      userId,
      name: '',
      duration: 0,
      urgent: false,
      important: false,
      scheduledAt: '',
      dueAt: '',
      type: 'Task',
      notes: '',
      createdAt: now,
      updatedAt: now,
      ...partial,
    }
    await repoAdd(task)
    setTasks(prev => [...prev, task])
  }

  const updateTask = async (id, updates) => {
    const next = tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)
    const updated = next.find(t => t.id === id)
    if (updated) await repoUpdate(updated)
    setTasks(next)
  }

  const deleteTask = async (id) => {
    await repoRemove(id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const reload = async () => {
    const all = await repoListAll()
    setTasks(all)
  }

  return { tasks, loading, addTask, updateTask, deleteTask, reload }
}


