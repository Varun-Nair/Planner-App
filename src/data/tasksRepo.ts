import { db, type Task } from './db'

export async function listAll(): Promise<Task[]> {
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


