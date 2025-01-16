import { delay } from '../shared/delay'
import moment, { Moment } from 'moment-timezone'

export async function delayUntil(endTime: Moment): Promise<void> {
  while (endTime.diff(moment(), 'minute') >= 1) {
    await delay(1000 * 60)
  }

  const secondsLeft = endTime.diff(moment(), 'second')
  await delay(1000 * secondsLeft)
}