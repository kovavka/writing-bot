import { ContextWithSession } from '../../shared/bot/context'
import { globalSession } from '../event-data'
import * as db from '../database'
import { texts } from '../copy/texts'
import { TIME_FORMAT_OUTPUT } from '../../shared/variables'

export async function sprintFinalWordsHandler(
  ctx: ContextWithSession,
  words: number
): Promise<void> {
  const { id: userId } = ctx.from
  if (globalSession.eventData === undefined) {
    return Promise.reject('eventData is undefined')
  }
  const { eventId, sprintId, sprintNumber, breakDuration, nextSprintStart } =
    globalSession.eventData

  const [event, sprint] = await Promise.all([db.getEvent(eventId), db.getSprint(sprintId)])

  if (event === undefined) {
    return Promise.reject(`Event is undefined, eventId = ${eventId}`)
  }

  if (sprint === undefined) {
    return Promise.reject(`Sprint is undefined, sprintId = ${sprintId}`)
  }

  if (event.status === 'finished') {
    await ctx.reply(texts.eventIsAlreadyFinished)
  } else {
    await db.updateSprintUser(userId, sprintId, words)

    if (sprintNumber === event.sprintsNumber) {
      // last sprint
      await ctx.reply(texts.wordsUpdatedLastSprint(words))
    } else {
      await ctx.reply(
        texts.wordsUpdated(words, breakDuration, nextSprintStart.format(TIME_FORMAT_OUTPUT))
      )
    }
  }
}
