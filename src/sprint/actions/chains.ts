import { ContextWithSession } from '../../shared/bot/context'
import { MeowsTextChainType } from '../types'
import { BotTextChainAction, TextChainSessionData } from '../../shared/bot/actions'
import { texts } from '../copy/texts'
import * as db from '../database'
import { buttons } from '../copy/buttons'

type BaseSessionData = TextChainSessionData<MeowsTextChainType>

export type CreateEventChainData = BaseSessionData & {
  startDate?: string
  startTime?: string
  sprintsNumber?: number
}

export type AnySessionData = CreateEventChainData | BaseSessionData

async function eventDateHandler(
  ctx: ContextWithSession,
  startDate: string,
  sessionData: CreateEventChainData
): Promise<void> {
  sessionData.startDate = startDate
  await ctx.reply(texts.setEventTime)
}

async function eventTimeHandler(
  ctx: ContextWithSession,
  startTime: string,
  sessionData: CreateEventChainData
): Promise<void> {
  sessionData.startTime = startTime
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
  const { startDate, startTime, sprintsNumber } = sessionData
  if (startDate === undefined || startTime === undefined || sprintsNumber === undefined) {
    return Promise.reject(
      `Create event: data is missing. startDate=${startDate}, startTime=${startTime}, sprintsNumber=${sprintsNumber}`
    )
  }

  const id = await db.createEvent(startDate, startTime, sprintsNumber, sprintDuration)

  await ctx.reply(texts.eventCreated(startDate, startTime), {
    reply_markup: {
      inline_keyboard: [[buttons.openEvent(id)]],
    },
  })
}

async function wordsStartHandler(
  ctx: ContextWithSession
  // words: number,
): Promise<void> {
  await ctx.reply(texts.wordsSet)
}

export const textInputCommands: BotTextChainAction<MeowsTextChainType, BaseSessionData>[] = [
  {
    type: MeowsTextChainType.CreateEvent,
    stages: [
      {
        inputType: 'string',
        handler: eventDateHandler,
      },
      {
        inputType: 'string',
        handler: eventTimeHandler,
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
