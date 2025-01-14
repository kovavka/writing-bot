import { CallbackQueryContext, ContextWithSession } from '../../shared/bot/context'
import { MeowsQueryActionType, MeowsTextChainType } from '../types'
import { BotQueryAction, SendMessageType, TextChainSessionData } from '../../shared/bot/actions'
import { texts } from '../copy/texts'
import * as db from '../database'
import { Event } from '../database/types'
import { stringToDateTime } from '../../shared/date'
import { ADMIN_ID } from '../../shared/variables'
import { InlineKeyboardButton } from '../../shared/copy/types'
import { buttons } from '../copy/buttons'
import moment, { Moment } from 'moment-timezone'
import { executeAtTime } from '../time-utils'
import { createSprint } from '../database'
import { EventData } from './chains'

async function createEventHandler(ctx: ContextWithSession): Promise<void> {
  await ctx.reply(texts.setEventDateTime)
}

function saveEventId(ctx: ContextWithSession, eventId: number): void {
  const { id: userId } = ctx.from
  ctx.session[userId] = <Omit<EventData, keyof TextChainSessionData<MeowsTextChainType>>>{
    eventId,
  }
}

async function runSprint(
  event: Event,
  sprintStart: Moment,
  userIds: number[],
  sendMessage: SendMessageType<MeowsQueryActionType>
): Promise<void> {
  await executeAtTime(sprintStart, () => {
    sendMessage(
      // todo userIds,
      [Number(ADMIN_ID)],
      texts.sprintStarted(event.sprintDuration),
      []
    )
  })

  await executeAtTime(sprintStart.add('30', 'seconds'), () => {
    sendMessage(
      // todo userIds,
      [Number(ADMIN_ID)],
      texts.sprintFinished,
      [buttons.setWordsEnd(event.id)]
    )
  })

  // todo create new sprint
}

async function openEventHandler(
  ctx: ContextWithSession,
  sendMessage: (
    userIds: number[],
    text: string,
    buttons: InlineKeyboardButton<MeowsQueryActionType>[]
  ) => Promise<void>,
  eventIdStr: string
): Promise<void> {
  const eventId = Number(eventIdStr)

  await ctx.reply(texts.eventNotificationStarted)
  const [users, event] = await Promise.all([db.getAllUsers(), db.getEvent(eventId)])

  if (event === undefined) {
    return Promise.reject(`Event is undefined, eventId = ${eventId}`)
  }

  const date = stringToDateTime(event.startDateTime)
  const userIds = users.map(x => x.id)

  await sendMessage(
    // todo userIds,
    [Number(ADMIN_ID)],
    texts.registrationOpened(date),
    [buttons.register(eventId)]
  )

  await createSprint(eventId, event.startDateTime)

  const runAt = moment().add('10', 'second')

  executeAtTime(runAt, () => {
    // todo send to only registered users
    sendMessage(
      // todo userIds,
      [Number(ADMIN_ID)],
      texts.eventStarted,
      [buttons.joinEvent(eventId)]
    )
    runSprint(event, runAt.add('10', 'seconds'), userIds, sendMessage)
  })

  await db.updateEventStatus(eventId, 'open')
  await ctx.reply(texts.eventOpened)
}

async function registerHandler(
  ctx: ContextWithSession<CallbackQueryContext>,
  eventIdStr: string
): Promise<void> {
  const { id: userId } = ctx.from
  const eventId = Number(eventIdStr)

  await db.createEventUser(userId, eventId)
  ctx.editMessageReplyMarkup(undefined)
  await ctx.reply(texts.registered)
}

async function joinEventHandler(
  ctx: ContextWithSession<CallbackQueryContext>,
  eventIdStr: string
): Promise<void> {
  const { id: userId } = ctx.from
  const eventId = Number(eventIdStr)
  saveEventId(ctx, eventId)

  // check if event is still running
  await db.updateEventUser(userId, eventId, 1)
  await ctx.reply(texts.setWordsStart)
}

async function setWordsEndHandler(
  ctx: ContextWithSession<CallbackQueryContext>,
  eventIdStr: string
): Promise<void> {
  const eventId = Number(eventIdStr)
  saveEventId(ctx, eventId)
}

export const queryMap: BotQueryAction<MeowsQueryActionType, MeowsTextChainType>[] = [
  {
    type: MeowsQueryActionType.CreateEvent,
    handler: createEventHandler,
    chainCommand: MeowsTextChainType.CreateEvent,
  },
  {
    type: MeowsQueryActionType.OpenEvent,
    handlerType: 'allow_global',
    handler: openEventHandler,
  },
  {
    type: MeowsQueryActionType.Register,
    handler: registerHandler,
  },
  {
    type: MeowsQueryActionType.JoinEvent,
    handler: joinEventHandler,
    chainCommand: MeowsTextChainType.SetWordsStart,
  },
  {
    type: MeowsQueryActionType.SetWordsEnd,
    handler: setWordsEndHandler,
    chainCommand: MeowsTextChainType.SetWordsEnd,
  },
]
