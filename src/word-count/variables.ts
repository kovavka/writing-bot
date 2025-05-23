import moment from 'moment-timezone'
import { DATE_FORMAT, TIME_ZONE } from '../shared/variables'

export const MARATHON_END_STR = '2025-05-31'
export const MARATHON_END_DATE = moment.tz(MARATHON_END_STR, DATE_FORMAT, TIME_ZONE)

export const DEFAULT_PROJECT_NAME = 'Без названия'
