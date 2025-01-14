import { ContextWithSession } from '../../shared/bot/context'
import { MeowsTextChainType } from '../types'
import { BotTextChainAction, TextChainSessionData } from '../../shared/bot/actions'
import { texts } from '../copy/texts'
import * as db from '../database'
import { buttons } from '../copy/buttons'
import { stringToDateTime } from '../../shared/date'

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

async function wordsStartHandler(
  ctx: ContextWithSession,
  words: number,
  sessionData: EventData
): Promise<void> {
  const { id: userId } = ctx.from
  const { eventId } = sessionData
  if (eventId === undefined) {
    return Promise.reject('EventId is undefined')
  }

  const [event, sprint] = await Promise.all([db.getEvent(eventId), db.getLatestSprint(eventId)])

  if (event === undefined) {
    return Promise.reject(`Event is undefined, eventId = ${eventId}`)
  }

  if (sprint === undefined) {
    return Promise.reject(`Sprint is undefined, eventId = ${sprint}`)
  }

  if (event.status === 'finished') {
    await ctx.reply(texts.eventIsAlreadyFinished)
  } else {
    await db.createSprintUser(userId, sprint.id, words)

    // todo different messages depending on if the sprint is started or not
    await ctx.reply(texts.wordsSet)
  }
}

async function wordsEndHandler(
  ctx: ContextWithSession,
  words: number,
  sessionData: EventData
): Promise<void> {
  const { id: userId } = ctx.from
  const { eventId } = sessionData
  if (eventId === undefined) {
    return Promise.reject('EventId is undefined')
  }

  // get SprintUser row and check
  const [event, sprint] = await Promise.all([db.getEvent(eventId), db.getLatestSprint(eventId)])

  if (event === undefined) {
    return Promise.reject(`Event is undefined, eventId = ${eventId}`)
  }

  if (sprint === undefined) {
    return Promise.reject(`Sprint is undefined, eventId = ${sprint}`)
  }

  if (event.status === 'finished') {
    await ctx.reply(texts.eventIsAlreadyFinished)
  } else {
    await db.updateSprintUser(userId, sprint.id, words)

    // todo
    await ctx.reply(texts.wordsUpdated(100))
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
  {
    type: MeowsTextChainType.SetWordsEnd,
    stages: [
      {
        inputType: 'number',
        handler: wordsEndHandler,
      },
    ],
  },
]
