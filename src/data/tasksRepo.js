import { supabase } from '../lib/supabase'

export async function listAll(user) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  console.log('FETCH:', { data, error })
  if (error) throw error
  return data || []
}

export async function addTask(user, task) {
  const allowed = new Set(['task', 'issue', 'project'])
  const normalizedType = (() => {
    const t = (task?.type || 'task').toString().toLowerCase().trim()
    return allowed.has(t) ? t : 'task'
  })()
  const payload = {
    user_id: user.id,
    name: task.name,
    duration_minutes: task.duration,
    is_urgent: !!task.urgent,
    is_important: !!task.important,
    scheduled_at: task.scheduledAt || null,
    due_at: task.dueAt || null,
    type: normalizedType,
    notes: task.notes || null,
  }
  console.log('INSERT PAYLOAD:', payload)
  console.log('FINAL TYPE VALUE:', JSON.stringify(payload.type))
  const { data, error } = await supabase
    .from('tasks')
    .insert([payload])
    .select('*')
    .single()
  console.log('INSERT:', { data, error })
  if (error) throw error
  return data
}

export async function updateTask(user, task) {
  const allowed = new Set(['task', 'issue', 'project'])
  const normalizedType = (() => {
    const t = (task?.type || 'task').toString().toLowerCase().trim()
    return allowed.has(t) ? t : 'task'
  })()
  const { data, error } = await supabase
    .from('tasks')
    .update({
      name: task.name,
      duration_minutes: task.duration,
      is_urgent: !!task.urgent,
      is_important: !!task.important,
      scheduled_at: task.scheduledAt || null,
      due_at: task.dueAt || null,
      type: normalizedType,
      notes: task.notes || null,
    })
    .eq('id', task.id)
    .eq('user_id', user.id)
    .select('*')
    .single()
  console.log('UPDATE:', { data, error })
  if (error) throw error
  return data
}

export async function deleteTask(user, id) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  console.log('DELETE:', { error })
  if (error) throw error
}

export async function testInsert(user) {
  const payload = {
    user_id: user.id,
    name: 'Test Task',
    duration_minutes: 5,
    is_urgent: false,
    is_important: false,
    type: 'task',
  }

  console.log('TEST PAYLOAD:', payload)

  const { data, error } = await supabase
    .from('tasks')
    .insert([payload])
    .select('*')

  console.log('TEST RESULT:', { data, error })
}


