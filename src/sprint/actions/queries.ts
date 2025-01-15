import { CallbackQueryContext, ContextWithSession } from '../../shared/bot/context'
import { MeowsQueryActionType, MeowsTextChainType } from '../types'
import { BotQueryAction, SendMessageType, TextChainSessionData } from '../../shared/bot/actions'
import { texts } from '../copy/texts'
import * as db from '../database'
import { Event } from '../database/types'
import { stringToDateTime } from '../../shared/date'
import { DATE_TIME_FORMAT, TIME_FORMAT_OUTPUT } from '../../shared/variables'
import { InlineKeyboardButton } from '../../shared/copy/types'
import { buttons } from '../copy/buttons'
import { Moment } from 'moment-timezone'
import { delayUntil } from '../time-utils'
import { createSprint } from '../database'
import { EventData } from './chains'
import { startNewChain } from '../../shared/bot/utils'
import { globalSession } from '../event-data'
import {
  DEFAULT_BREAK_DURATION,
  LONGER_BREAK_DURATION,
  NOTIFICATION_OFFSET,
} from '../variables'

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
  eventId: number,
  sprintDuration: number,
  sprintStartMoment: Moment,
  sendMessage: SendMessageType<MeowsQueryActionType, MeowsTextChainType>
): Promise<void> {
  await delayUntil(sprintStartMoment)

  const sprintEndMoment = sprintStartMoment.add(sprintDuration, 'minutes')

  const activeUserIds = (await db.getEventUsers(eventId, 1)).map(x => x.userId)
  await sendMessage(
    activeUserIds,
    texts.sprintStarted(sprintDuration, sprintEndMoment.format(TIME_FORMAT_OUTPUT)),
    []
  )

  await delayUntil(sprintEndMoment)

  // in case someone joined after the sprint started
  const nextActiveUserIds = (await db.getEventUsers(eventId, 1)).map(x => x.userId)
  await sendMessage(
    nextActiveUserIds,
    texts.sprintFinished,
    [],
    MeowsTextChainType.SetSprintWords
  )
}

async function startEvent(
  event: Event,
  sendMessage: SendMessageType<MeowsQueryActionType, MeowsTextChainType>
): Promise<void> {
  const eventStartMoment = stringToDateTime(event.startDateTime)
  const registeredUserIds = (await db.getEventUsers(event.id)).map(x => x.userId)

  const joinNotificationMoment = eventStartMoment.subtract(NOTIFICATION_OFFSET, 'minutes')

  await delayUntil(joinNotificationMoment)

  const [firstSprintId] = await Promise.all([
    createSprint(event.id, event.startDateTime),
    db.updateEventStatus(event.id, 'started'),
  ])

  await sendMessage(registeredUserIds, texts.eventStarted, [buttons.joinEvent(event.id)])

  let sprintStartMoment = eventStartMoment
  let sprintId = firstSprintId
  for (let i = 0; i < event.sprintsNumber; i++) {
    const breakDuration = i % 3 === 2 ? LONGER_BREAK_DURATION : DEFAULT_BREAK_DURATION
    const nextSprintStartMoment = sprintStartMoment.add(breakDuration, 'minutes')

    globalSession.eventData = {
      eventId: event.id,
      sprintId,
      sprintNumber: i + 1,
      breakDuration,
      nextSprintStart: nextSprintStartMoment,
    }
    await runSprint(event.id, event.sprintDuration, sprintStartMoment, sendMessage)

    const isLastSprint = i === event.sprintsNumber - 1
    if (!isLastSprint) {
      sprintStartMoment = nextSprintStartMoment
      sprintId = await createSprint(event.id, sprintStartMoment.format(DATE_TIME_FORMAT))
    }
  }
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

async function joinEvent(
  ctx: ContextWithSession<CallbackQueryContext>,
  eventId: number
): Promise<void> {
  const { id: userId } = ctx.from
  saveEventId(ctx, eventId)

  // check if event is still running
  await db.updateEventUser(userId, eventId, 1)
  await ctx.reply(texts.setWordsStart)
}

async function registerHandler(
  ctx: ContextWithSession<CallbackQueryContext>,
  eventIdStr: string
): Promise<void> {
  const { id: userId } = ctx.from
  const eventId = Number(eventIdStr)

  const event = await db.getEvent(eventId)

  if (event === undefined) {
    return Promise.reject(`Event is undefined, eventId = ${eventId}`)
  }

  if (event.status === 'finished') {
    await ctx.reply(texts.eventIsAlreadyFinished)
    ctx.editMessageReplyMarkup(undefined)
  } else {
    await db.createEventUser(userId, eventId)
    ctx.editMessageReplyMarkup(undefined)

    if (event.status === 'started') {
      await joinEvent(ctx, eventId)
      startNewChain(ctx, MeowsTextChainType.SetWordsStart)
    } else {
      await ctx.reply(texts.registered)
    }
  }
}

async function joinEventHandler(
  ctx: ContextWithSession<CallbackQueryContext>,
  eventIdStr: string
): Promise<void> {
  const eventId = Number(eventIdStr)
  await joinEvent(ctx, eventId)
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
]
