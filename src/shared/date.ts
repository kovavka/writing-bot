import { DATE_FORMAT, DATE_TIME_FORMAT, TIME_ZONE } from './variables'
import moment, { Moment } from 'moment-timezone'

export function getToday(): Moment {
  return moment().tz(TIME_ZONE)
}

export function stringToDate(dateStr: string): Moment {
  return moment.tz(dateStr, DATE_FORMAT, TIME_ZONE)
}

export function stringToDateTime(dateStr: string): Moment {
  return moment.tz(dateStr, DATE_TIME_FORMAT, TIME_ZONE)
}

export function getTodayString(): string {
  return getToday().format(DATE_FORMAT)
}
