import Dexie, { Table } from 'dexie'

export type Task = {
  id: string
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
      // id is primary key; indexes on urgent, important, createdAt for mobile perf
      tasks: 'id, urgent, important, createdAt'
    })
  }
}

export const db = new PrioGlassDB()


