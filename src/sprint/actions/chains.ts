import { ContextWithSession } from '../../shared/bot/context'
import { MeowsTextChainType } from '../types'
import { BotTextChainAction, TextChainSessionData } from '../../shared/bot/actions'
import { texts } from '../copy/texts'
import * as db from '../database'
import { buttons } from '../copy/buttons'
import { stringToDateTime } from '../../shared/date'
import { GlobalSession } from '../global-session'
import { errors } from '../copy/errors'
import { replyWithCurrentState } from './shared'

type BaseSessionData = TextChainSessionData<MeowsTextChainType>

export type CreateEventChainData = BaseSessionData & {
  startDateTime?: string
  sprintsNumber?: number
}

export type EventData = BaseSessionData & {
  eventId?: number
}

export type AnySessionData = EventData | CreateEventChainData | BaseSessionData

// todo add custom input validation
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
      inline_keyboard: [[buttons.eventSchedule(id)], [buttons.openEvent(id)]],
    },
  })
}

async function wordsStartHandler(ctx: ContextWithSession, words: number): Promise<void> {
  const { id: userId } = ctx.from

  if (GlobalSession.instance.eventData === undefined) {
    await ctx.reply(errors.unknownCommand)
    return
  }

  const { eventStatus, sprintStatus } = GlobalSession.instance.eventData

  if (eventStatus === 'finished' || sprintStatus === 'lastSprintFinished') {
    await ctx.reply(texts.eventIsAlreadyFinished)
    return
  }
  const { eventId } = GlobalSession.instance.eventData

  GlobalSession.instance.eventData.participants[userId] = {
    startWords: words,
    active: true,
  }

  await db
    .createEventUser(userId, eventId, 1, words)
    .catch((err: unknown) => GlobalSession.instance.sendError(err))

  await replyWithCurrentState(ctx, GlobalSession.instance.eventData, texts.wordsSet)
}

async function changeUserNameHandler(ctx: ContextWithSession, userName: string): Promise<void> {
  const { id: userId } = ctx.from

  const user = GlobalSession.instance.users.find(x => x.id === userId)
  if (user == null) {
    // just in case
    GlobalSession.instance.addUser(userId, userName)
  } else {
    user.name = userName
    db.updateUser(userId, userName).catch((err: unknown) =>
      GlobalSession.instance.sendError(err)
    )
  }

  await ctx.reply(texts.userNameUpdated)
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
    type: MeowsTextChainType.ChangeName,
    stages: [
      {
        inputType: 'string',
        handler: changeUserNameHandler,
      },
    ],
  },
]
