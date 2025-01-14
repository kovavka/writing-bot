import { EventStatus } from '../types'

export type User = {
  id: number
  name: string
}

export type Event = {
  id: number
  startDate: string
  startTime: string
  sprintsNumber: number
  sprintDuration: number
  status: EventStatus
}

export type Sprint = {
  id: number
  eventId: number
  startDate: string
  startTime: string
}

export type EventUser = {
  eventId: number
  userId: number
  active: number
}

export type SprintUser = {
  sprintId: number
  userId: number
  wordsStart: number
  wordsEnd: number
}
