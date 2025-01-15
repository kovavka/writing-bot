import { CallbackQueryContext, ContextWithSession } from '../../shared/bot/context'
import { MeowsQueryActionType, MeowsTextChainType } from '../types'
import { BotQueryAction, SendMessageType, TextChainSessionData } from '../../shared/bot/actions'
import { texts } from '../copy/texts'
import * as db from '../database'
import { Event } from '../database/types'
import { stringToDateTime } from '../../shared/date'
import { DATE_TIME_FORMAT } from '../../shared/variables'
import { InlineKeyboardButton } from '../../shared/copy/types'
import { buttons } from '../copy/buttons'
import { Moment } from 'moment-timezone'
import { delayUntil } from '../time-utils'
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

async function startEvent(
  event: Event,
  sendMessage: SendMessageType<MeowsQueryActionType>
): Promise<void> {
  const eventStartMoment = stringToDateTime(event.startDateTime)
  const registeredUserIds = (await db.getEventUsers(event.id)).map(x => x.userId)

  // const joinNotificationMoment = eventStartMoment.subtract('5', 'minutes')
  const joinNotificationMoment = eventStartMoment.subtract('30', 'seconds')

  await delayUntil(joinNotificationMoment)

  const firstSprintId = await createSprint(event.id, event.startDateTime)

  await sendMessage(
    // todo change to registeredUsers
    registeredUserIds,
    texts.eventStarted,
    [buttons.joinEvent(event.id)]
  )

  let sprintId = firstSprintId
  let sprintStartMoment = eventStartMoment
  for (let i = 0; i < event.sprintsNumber; i++) {
    await runSprint(sprintId, event.sprintDuration, sprintStartMoment, sendMessage)

    if (i < event.sprintsNumber - 1) {
      const breakDuration = i % 3 === 2 ? 15 : 5
      sprintStartMoment = sprintStartMoment.add(breakDuration, 'minutes')
      sprintId = await createSprint(event.id, sprintStartMoment.format(DATE_TIME_FORMAT))
    }
  }
}

async function runSprint(
  sprintId: number,
  sprintDuration: number,
  sprintStartMoment: Moment,
  sendMessage: SendMessageType<MeowsQueryActionType>
): Promise<void> {
  await delayUntil(sprintStartMoment)
  const joinedUserIds = (await db.getSprintUsers(sprintId)).map(x => x.userId)

  await sendMessage(joinedUserIds, texts.sprintStarted(sprintDuration), [])

  await delayUntil(sprintStartMoment.add(sprintDuration, 'minutes'))
  // in case someone joined after the sprint started
  const nextJoinedUserIds = (await db.getSprintUsers(sprintId)).map(x => x.userId)

  await sendMessage(nextJoinedUserIds, texts.sprintFinished, [])
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

  await sendMessage(userIds, texts.registrationOpened(date), [buttons.register(eventId)])

  // should run in background, never use await here
  startEvent(event, sendMessage)

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
