import { Moment } from 'moment-timezone'

type EventDataType = {
  eventId: number
  sprintId: number
  status: 'break' | 'sprint' | 'finished'
  sprintNumber: number
  breakDuration: number
  nextSprintStart: Moment
}

type GlobalSession = {
  eventData: EventDataType | undefined
}

export const globalSession: GlobalSession = {
  eventData: undefined,
}
