import { Moment } from 'moment-timezone'

export function getRemainingDays(dateFrom: Moment, dateTo: Moment): number {
  // including both
  return dateTo.startOf('day').diff(dateFrom.startOf('day'), 'days') + 1
}
