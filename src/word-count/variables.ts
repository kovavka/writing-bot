import moment from 'moment-timezone'
import { DATE_FORMAT, TIME_ZONE } from '../shared/variables'

export const MARATHON_START_STR = '2026-02-14'
export const MARATHON_END_STR = '2026-03-31'
export const MARATHON_END_DATE = moment.tz(MARATHON_END_STR, DATE_FORMAT, TIME_ZONE)
export const MARATHON_WORD_GOAL = 30000

export const DEFAULT_PROJECT_NAME = 'Без названия'
