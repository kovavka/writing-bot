import { DATE_FORMAT, TIME_ZONE } from './variables'
import moment, { Moment } from 'moment-timezone'

export function getToday(): Moment {
  const date = moment()
  return date.tz(TIME_ZONE)
}

export function dateToString(date = getToday()): string {
  return date.tz(TIME_ZONE).format(DATE_FORMAT)
}

export function stringToDate(dateStr: string): Moment {
  return moment(dateStr, DATE_FORMAT).tz(TIME_ZONE)
}

export function getTodayString(): string {
  return dateToString(moment().tz(TIME_ZONE))
}
