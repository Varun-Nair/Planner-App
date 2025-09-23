import Dexie, { Table } from 'dexie'

export type Task = {
  id: string
  userId?: string
  name: string
  duration: number
  urgent: boolean
  important: boolean
  scheduledAt?: string
  dueAt?: string
  type: 'Task' | 'Issue' | 'Project'
  notes?: string
  createdAt: string
  updatedAt: string
}

class PrioGlassDB extends Dexie {
  tasks!: Table<Task, string>

  constructor() {
    super('PrioGlassDB')
    this.version(1).stores({
      // v1: base schema
      tasks: 'id, urgent, important, createdAt'
    })
    this.version(2).stores({
      // v2: add userId index and compound indexes
      tasks: 'id, userId, urgent, important, createdAt, [userId+createdAt]'
    }).upgrade(async (tx) => {
      // No data transform needed, tasks remain compatible; userId stays undefined for local users
      await tx.table('tasks').toCollection().modify((t: any) => {
        if (!('userId' in t)) t.userId = undefined
      })
    })
  }
}

export const db = new PrioGlassDB()


