import { supabase } from '../lib/supabase'

const toUiTask = (row) => {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    duration: row.duration_minutes,
    urgent: !!row.is_urgent,
    important: !!row.is_important,
    scheduledAt: row.scheduled_at || '',
    dueAt: row.due_at || '',
    type: row.type,
    notes: row.notes || '',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || row.created_at || '',
  }
}

const toPayload = (userId, task) => ({
  user_id: userId,
  name: task.name,
  duration_minutes: Number(task.duration),
  is_urgent: !!task.urgent,
  is_important: !!task.important,
  scheduled_at: task.scheduledAt || null,
  due_at: task.dueAt || null,
  type: task.type,
  notes: task.notes || null,
})

export async function listAll(userId) {
  console.log('USER', userId)
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  console.log('FETCH', { data, error })
  if (error) throw error
  return (data || []).map(toUiTask)
}

export async function addTask(userId, task) {
  const payload = toPayload(userId, task)
  const { data, error } = await supabase
    .from('tasks')
    .insert([payload])
    .select('*')
    .single()
  console.log('INSERT', { data, error })
  if (error) throw error
  return toUiTask(data)
}

export async function updateTask(userId, task) {
  const { data, error } = await supabase
    .from('tasks')
    .update(toPayload(userId, task))
    .eq('id', task.id)
    .select('*')
    .single()
  console.log('UPDATE', { data, error })
  if (error) throw error
  return toUiTask(data)
}

export async function deleteTask(userId, id) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
  console.log('DELETE', { id, error })
  if (error) throw error
}


