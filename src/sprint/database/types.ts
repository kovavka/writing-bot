import { EventStatus } from '../types'

export type User = {
  id: number
  name: string
}

export type Event = {
  id: number
  startDateTime: string
  sprintsNumber: number
  sprintDuration: number
  status: EventStatus
}

export type Sprint = {
  id: number
  eventId: number
  startDateTime: string
}

export type EventUser = {
  eventId: number
  userId: number
  active?: 0 | 1
  startWords?: number
}

export type SprintUser = {
  sprintId: number
  userId: number
  finalWords: number
}
