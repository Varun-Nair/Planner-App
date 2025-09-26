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

// Deprecated: legacy localStorage migration removed in Supabase mode

// React-friendly repository hook maintaining tasks array in state while persisting to Supabase
export function useTasksRepository(userId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const toUi = (row) => row && ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    duration: Number(row.duration_minutes ?? 0),
    urgent: !!row.is_urgent,
    important: !!row.is_important,
    scheduledAt: row.scheduled_at || '',
    dueAt: row.due_at || '',
    type: row.type,
    notes: row.notes || '',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || row.created_at || '',
  })

  useEffect(() => {
    (async () => {
      try {
        if (!userId) { setTasks([]); setLoading(false); return }
        const { data: { user } } = await supabase.auth.getUser()
        console.log('USER:', user)
        const rows = await repoListAll(user)
        setTasks((rows || []).map(toUi))
        setLoading(false)
      } catch (error) {
        console.error('FETCH failed', error)
        alert('Failed to load tasks. See console for details.')
        setLoading(false)
      }
    })()
  }, [userId])

  const addTask = async (partial) => {
    try {
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
      const { data: { user } } = await supabase.auth.getUser()
      const createdRow = await repoAddTask(user, task)
      const created = toUi(createdRow)
      setTasks(prev => [created, ...prev])
    } catch (error) {
      console.error('addTask failed', error)
      alert('Failed to add task. Check console for details.')
    }
  }

  const updateTask = async (id, updates) => {
    try {
      const existing = tasks.find(t => t.id === id)
      if (!existing) return
      const { data: { user } } = await supabase.auth.getUser()
      const updatedRow = await repoUpdateTask(user, { ...existing, ...updates })
      const updated = toUi(updatedRow)
      setTasks(prev => prev.map(t => t.id === id ? updated : t))
    } catch (error) {
      console.error('updateTask failed', error)
      alert('Failed to update task. Check console for details.')
    }
  }

  const deleteTask = async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await repoDeleteTask(user, id)
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch (error) {
      console.error('deleteTask failed', error)
      alert('Failed to delete task. Check console for details.')
    }
  }

  const reload = async () => {
    try {
      if (!userId) { setTasks([]); return }
      const { data: { user } } = await supabase.auth.getUser()
      const rows = await repoListAll(user)
      setTasks((rows || []).map(toUi))
    } catch (error) {
      console.error('FETCH reload failed', error)
    }
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
        try {
          const { data: { user } } = await supabase.auth.getUser()
          const rows = await repoListAll(user)
          setTasks((rows || []).map(toUi))
        } catch {}
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return { tasks, loading, addTask, updateTask, deleteTask, reload }
}


