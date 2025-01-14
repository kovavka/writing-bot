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

export type AnySessionData = CreateEventChainData | BaseSessionData

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
