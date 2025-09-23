import { db, type Task } from './db'

export async function listAll(userId?: string): Promise<Task[]> {
  if (userId) {
    // Use userId index then order client-side by createdAt
    const rows = await db.tasks.where('userId').equals(userId).toArray()
    return rows.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
  }
  return db.tasks.orderBy('createdAt').toArray()
}

export async function get(id: string): Promise<Task | undefined> {
  return db.tasks.get(id)
}

export async function add(task: Task): Promise<string> {
  return db.tasks.add(task)
}

export async function update(task: Task): Promise<number> {
  return db.tasks.update(task.id, task)
}

export async function remove(id: string): Promise<void> {
  await db.tasks.delete(id)
}

export async function bulkImport(tasks: Task[]): Promise<void> {
  await db.transaction('rw', db.tasks, async () => {
    await db.tasks.bulkPut(tasks)
  })
}

export async function clearAll(): Promise<void> {
  await db.tasks.clear()
}


