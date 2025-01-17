import { ContextWithSession } from '../../shared/bot/context'
import { MeowsTextChainType } from '../types'
import { BotTextChainAction, TextChainSessionData } from '../../shared/bot/actions'
import { texts } from '../copy/texts'
import * as db from '../database'
import { buttons } from '../copy/buttons'
import { getToday, stringToDateTime } from '../../shared/date'
import { GlobalSession } from '../global-session'
import { errors } from '../copy/errors'

type BaseSessionData = TextChainSessionData<MeowsTextChainType>

export type CreateEventChainData = BaseSessionData & {
  startDateTime?: string
  sprintsNumber?: number
}

export type EventData = BaseSessionData & {
  eventId?: number
}

export type AnySessionData = EventData | CreateEventChainData | BaseSessionData

async function eventDateTimeHandler(
  ctx: ContextWithSession,
  startDateTime: string,
  sessionData: CreateEventChainData
): Promise<void> {
  sessionData.startDateTime = startDateTime
  await ctx.reply(texts.setEventSprintsNumber)
}

async function eventSprintsNumberHandler(
  ctx: ContextWithSession,
  sprintsNumber: number,
  sessionData: CreateEventChainData
): Promise<void> {
  sessionData.sprintsNumber = sprintsNumber
  await ctx.reply(texts.setEventSprintDuration)
}

async function eventSprintDurationHandler(
  ctx: ContextWithSession,
  sprintDuration: number,
  sessionData: CreateEventChainData
): Promise<void> {
  const { startDateTime, sprintsNumber } = sessionData
  if (startDateTime === undefined || sprintsNumber === undefined) {
    return Promise.reject(
      `Create event: data is missing. startDateTime=${startDateTime}, sprintsNumber=${sprintsNumber}`
    )
  }

  const id = await db.createEvent(startDateTime, sprintsNumber, sprintDuration)

  await ctx.reply(texts.eventCreated(stringToDateTime(startDateTime)), {
    reply_markup: {
      inline_keyboard: [[buttons.openEvent(id)]],
    },
  })
}

async function wordsStartHandler(ctx: ContextWithSession, words: number): Promise<void> {
  const { id: userId } = ctx.from

  if (GlobalSession.instance.eventData === undefined) {
    await ctx.reply(errors.unknownCommand)
    return
  }

  const { eventStatus } = GlobalSession.instance.eventData

  if (eventStatus === 'finished') {
    await ctx.reply(texts.eventIsAlreadyFinished)
    return
  }
  const { eventId, isBreak, sprintIndex } = GlobalSession.instance.eventData
  // todo might not exist yet
  const currentSprint = GlobalSession.instance.eventData.sprints[sprintIndex]

  GlobalSession.instance.eventData.participants[userId] = {
    startWords: words,
    active: true,
  }

  db.updateEventUser(userId, eventId, 1, words).catch((err: unknown) =>
    GlobalSession.instance.sendError(err)
  )
  const currentMoment = getToday()

  const minutesLeft = currentSprint.endMoment.diff(currentMoment, 'minutes')

  if (isBreak) {
    // break between sprints
    const minutesToStart = currentSprint.startMoment.diff(currentMoment, 'minutes')
    await ctx.reply(texts.wordsSetBeforeStart(minutesToStart))
  } else if (minutesLeft <= 0) {
    // in the end of sprint we might already get -1, so better to send a different message
    await ctx.reply(texts.wordsSetBeforeFinish)
  } else {
    // sprint is already started
    await ctx.reply(texts.wordsSetAfterStart(minutesLeft))
  }
}

export const textInputCommands: BotTextChainAction<MeowsTextChainType, AnySessionData>[] = [
  {
    type: MeowsTextChainType.CreateEvent,
    stages: [
      {
        inputType: 'string',
        handler: eventDateTimeHandler,
      },
      {
        inputType: 'number',
        handler: eventSprintsNumberHandler,
      },
      {
        inputType: 'number',
        handler: eventSprintDurationHandler,
      },
    ],
  },
  {
    type: MeowsTextChainType.SetWordsStart,
    stages: [
      {
        inputType: 'number',
        handler: wordsStartHandler,
      },
    ],
  },
]
