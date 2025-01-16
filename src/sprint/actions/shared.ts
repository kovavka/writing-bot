import { ContextWithSession } from '../../shared/bot/context'
import { globalSession } from '../event-data'
import * as db from '../database'
import { texts } from '../copy/texts'
import { TIME_FORMAT_OUTPUT } from '../../shared/variables'
import { errors } from '../copy/errors'
import { buttons } from '../copy/buttons'

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

  const [event, sprint, eventUser] = await Promise.all([
    db.getEvent(eventId),
    db.getSprint(sprintId),
    db.getEventUser(userId, eventId),
  ])

  if (eventUser === undefined) {
    await ctx.reply(errors.unknownCommand)
    return
  }

  if (event === undefined) {
    return Promise.reject(`Event is undefined, eventId = ${eventId}`)
  }

  if (sprint === undefined) {
    return Promise.reject(`Sprint is undefined, sprintId = ${sprintId}`)
  }

  if (event.status === 'finished') {
    await ctx.reply(texts.eventIsAlreadyFinished)
  } else {
    const sprintUser = await db.getSprintUser(userId, sprintId)

    if (sprintUser === undefined) {
      await db.createSprintUser(userId, sprintId, words)
    } else {
      await db.updateSprintUser(userId, sprintId, words)
    }
    // todo compare with prev sprint
    const wordsDiff = words - (eventUser.startWords ?? 0)

    if (sprintNumber === event.sprintsNumber) {
      // last sprint
      await ctx.reply(texts.wordsUpdatedLastSprint(wordsDiff))
    } else {
      await ctx.reply(
        texts.wordsUpdated(
          wordsDiff,
          breakDuration,
          nextSprintStart.format(TIME_FORMAT_OUTPUT)
        ),
        {
          reply_markup: {
            inline_keyboard: [[buttons.leaveEvent(eventId)]],
          },
        }
      )
    }
  }
}
