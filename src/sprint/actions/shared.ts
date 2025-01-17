import { ContextWithSession } from '../../shared/bot/context'
import { GlobalSession } from '../global-session'
import * as db from '../database'
import { texts } from '../copy/texts'
import { errors } from '../copy/errors'
import { buttons } from '../copy/buttons'

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
    if (currentSprint.results[userId] === undefined) {
      db.createSprintUser(userId, currentSprint.id, finalWords).catch(err =>
        GlobalSession.instance.sendError(err)
      )
    } else {
      db.updateSprintUser(userId, currentSprint.id, finalWords).catch(err =>
        GlobalSession.instance.sendError(err)
      )
    }

    let prevWords: number | undefined
    for (let i = sprintIndex - 1; i >= 0; i--) {
      const sprint = GlobalSession.instance.eventData.sprints[i]
      const result = sprint.results[userId]
      if (result !== undefined) {
        prevWords = result.finalWords
        break
      }
    }

    const startWords = prevWords ?? participantData.startWords ?? 0
    const wordsDiff = finalWords - startWords
    currentSprint.results[userId] = {
      startWords,
      finalWords,
      diff: wordsDiff,
    }

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
