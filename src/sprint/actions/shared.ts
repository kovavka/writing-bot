import { ContextWithSession, SimpleContext } from '../../shared/bot/context'
import { EventDataType, GlobalSession } from '../global-session'
import * as db from '../database'
import { texts } from '../copy/texts'
import { errors } from '../copy/errors'
import { buttons } from '../copy/buttons'
import { getToday } from '../../shared/date'

export async function saveSprintUserResult(
  userId: number,
  sprintId: number,
  startWords: number,
  finalWords: number
): Promise<void> {
  try {
    // save in db for stat and as a backup
    const sprintUser = await db.getSprintUser(userId, sprintId)

    if (sprintUser === undefined) {
      await db.createSprintUser(userId, sprintId, startWords, finalWords)
    } else {
      await db.updateSprintUser(userId, sprintId, startWords, finalWords)
    }
  } catch (err) {
    GlobalSession.instance.sendError(err)
  }
}

export async function sprintFinalWordsHandler(
  ctx: ContextWithSession,
  finalWords: number
): Promise<void> {
  const { id: userId } = ctx.from
  if (GlobalSession.instance.eventData === undefined) {
    await ctx.reply(errors.unknownCommand)
    return
  }

  const { eventId, eventStatus, sprintIndex, sprintsNumber } = GlobalSession.instance.eventData

  const currentSprint = GlobalSession.instance.eventData.sprints[sprintIndex]
  const participantData = GlobalSession.instance.eventData.participants[userId]

  if (participantData === undefined) {
    await ctx.reply(errors.unknownCommand)
    return
  }

  if (eventStatus === 'finished') {
    await ctx.reply(texts.eventIsAlreadyFinished)
  } else {
    let prevWords: number | undefined

    const currentSprintResult = currentSprint.results[userId]
    if (currentSprintResult !== undefined) {
      prevWords = currentSprintResult.startWords
    } else {
      for (let i = sprintIndex - 1; i >= 0; i--) {
        const sprint = GlobalSession.instance.eventData.sprints[i]
        const result = sprint.results[userId]
        if (result !== undefined) {
          prevWords = result.finalWords
          break
        }
      }
    }

    const startWords = prevWords ?? participantData.startWords ?? 0
    const wordsDiff = finalWords - startWords
    currentSprint.results[userId] = {
      startWords,
      finalWords,
      diff: wordsDiff,
    }

    // no need to wait here
    saveSprintUserResult(userId, currentSprint.id, startWords, finalWords)

    if (sprintIndex + 1 === sprintsNumber) {
      // last sprint
      await ctx.reply(texts.wordsUpdatedLastSprint(wordsDiff))
    } else {
      await ctx.reply(texts.wordsUpdated(wordsDiff), {
        reply_markup: {
          inline_keyboard: [[buttons.leaveEvent(eventId)]],
        },
      })
    }
  }
}

export async function replyWithCurrentState(
  ctx: SimpleContext,
  eventData: EventDataType,
  reactionText: string
): Promise<void> {
  const { sprintStatus, nextStageMoment } = eventData

  const currentMoment = getToday()
  const minutesLeft = nextStageMoment.diff(currentMoment, 'minutes')

  if (sprintStatus === 'sprint') {
    // sprint is already started

    const { sprintIndex, sprints } = eventData
    const currentSprint = sprints[sprintIndex]

    await ctx.reply(texts.joinAfterStart(reactionText, minutesLeft, nextStageMoment), {
      reply_markup: {
        inline_keyboard: [[buttons.setSprintWordsStart(currentSprint.id)]],
      },
    })
  } else {
    // break between sprints
    await ctx.reply(texts.joinBeforeStart(reactionText, minutesLeft, nextStageMoment))
  }
}
