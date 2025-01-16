import { CallbackQueryContext, ContextWithSession } from '../../shared/bot/context'
import { MeowsQueryActionType, MeowsTextChainType } from '../types'
import { BotQueryAction, SendMessageType, TextChainSessionData } from '../../shared/bot/actions'
import { texts } from '../copy/texts'
import * as db from '../database'
import { Event } from '../database/types'
import { getToday, stringToDateTime } from '../../shared/date'
import { ADMIN_ID, DATE_TIME_FORMAT, TIME_FORMAT_OUTPUT } from '../../shared/variables'
import { InlineKeyboardButton } from '../../shared/copy/types'
import { buttons } from '../copy/buttons'
import { Moment } from 'moment-timezone'
import { delayUntil } from '../time-utils'
import { EventData } from './chains'
import { GlobalSession } from '../global-session'
import { DEFAULT_BREAK_DURATION, LONGER_BREAK_DURATION } from '../variables'
import { startNewChain } from '../../shared/bot/utils'
import { errors } from '../copy/errors'
import { delay } from '../../shared/delay'

async function createEventHandler(ctx: ContextWithSession): Promise<void> {
  await ctx.reply(texts.setEventDateTime)
}

function saveEventId(ctx: ContextWithSession, eventId: number): void {
  const { id: userId } = ctx.from
  ctx.session[userId] = <Omit<EventData, keyof TextChainSessionData<MeowsTextChainType>>>{
    eventId,
  }
}

// todo make sure this thing stops after stopping the process
async function runSprint(
  eventId: number,
  sprintIndex: number,
  sprintDuration: number,
  sprintStartMoment: Moment,
  sprintEndMoment: Moment,
  sendMessage: SendMessageType<MeowsQueryActionType>
): Promise<void> {
  await delayUntil(sprintStartMoment)

  // sprint started
  GlobalSession.instance.eventData!.sprintIndex = sprintIndex
  GlobalSession.instance.eventData!.isBreak = false

  const activeUserIds = (await db.getEventUsers(eventId, 1)).map(x => x.userId)
  await sendMessage(
    activeUserIds,
    texts.sprintStarted(
      sprintIndex + 1,
      sprintDuration,
      sprintEndMoment.format(TIME_FORMAT_OUTPUT)
    ),
    []
  )

  await delayUntil(sprintEndMoment)
}

async function startEvent(
  event: Event,
  sendMessage: SendMessageType<MeowsQueryActionType>
): Promise<void> {
  const eventStartMoment = stringToDateTime(event.startDateTime)
  const userIds = (await db.getAllUsers()).map(x => x.id)

  const [firstSprintId] = await Promise.all([
    db.createSprint(event.id, event.startDateTime),
    db.updateEventStatus(event.id, 'started'),
  ])

  GlobalSession.instance.eventData = {
    eventId: event.id,
    eventStatus: 'started',
    sprintsNumber: event.sprintsNumber,
    sprintIndex: 0,
    isBreak: true,
    sprints: [],
    participants: [],
  }

  const minutesLeft = eventStartMoment.diff(getToday(), 'minutes')

  await sendMessage(
    userIds,
    texts.eventStartingSoon(minutesLeft, eventStartMoment.format(TIME_FORMAT_OUTPUT)),
    [buttons.joinEvent(event.id)]
  )

  let sprintStartMoment = eventStartMoment
  let sprintId = firstSprintId
  for (let i = 0; i < event.sprintsNumber; i++) {
    const breakDuration = i % 3 === 2 ? LONGER_BREAK_DURATION : DEFAULT_BREAK_DURATION
    const sprintEndMoment = sprintStartMoment.clone().add(event.sprintDuration, 'minutes')

    GlobalSession.instance.eventData!.sprints.push({
      id: sprintId,
      startMoment: sprintStartMoment,
      endMoment: sprintEndMoment,
      results: {},
      breakDuration: breakDuration,
    })

    await runSprint(
      event.id,
      i,
      event.sprintDuration,
      sprintStartMoment,
      sprintEndMoment,
      sendMessage
    )

    // sprint just finished
    GlobalSession.instance.eventData!.isBreak = true

    // getting users again in case someone joined after the sprint started
    const nextActiveUserIds = (await db.getEventUsers(event.id, 1)).map(x => x.userId)

    const isLastSprint = i === event.sprintsNumber - 1
    if (isLastSprint) {
      await sendMessage(nextActiveUserIds, texts.sprintFinishedLast, [])
    } else {
      sprintStartMoment = sprintEndMoment.clone().add(breakDuration, 'minutes')
      sprintId = await db.createSprint(event.id, sprintStartMoment.format(DATE_TIME_FORMAT))
      await sendMessage(
        nextActiveUserIds,
        texts.sprintFinished(breakDuration, sprintStartMoment.format(TIME_FORMAT_OUTPUT)),
        []
      )
    }

    await delay(1000 * 60)

    await sendMessage(
      [Number(ADMIN_ID)],
      `data: ${JSON.stringify(GlobalSession.instance.eventData!.sprints[i].results)}`,
      []
    )
  }
}

export async function getEventById(eventId: number): Promise<Event> {
  const event = await db.getEvent(eventId)

  if (event === undefined) {
    return Promise.reject(`Event is undefined, eventId = ${eventId}`)
  }

  return event
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

  const event = await getEventById(eventId)

  // should run in background, never use await here
  startEvent(event, sendMessage)

  await ctx.reply(texts.adminEventOpened)
}

async function joinEventHandler(
  ctx: ContextWithSession<CallbackQueryContext>,
  eventIdStr: string
): Promise<void> {
  const eventId = Number(eventIdStr)
  const { id: userId } = ctx.from

  const event = await getEventById(eventId)
  saveEventId(ctx, eventId)

  if (event.status === 'finished') {
    await ctx.reply(texts.eventIsAlreadyFinished)
    return
  }

  const eventUser = await db.getEventUser(userId, eventId)
  if (eventUser === undefined) {
    await db.createEventUser(userId, eventId, 1)
    await ctx.reply(texts.setWordsStart)

    startNewChain(ctx, MeowsTextChainType.SetWordsStart)
  } else {
    await ctx.reply(texts.alreadyJoined)
  }
}

async function leaveEventHandler(
  ctx: ContextWithSession<CallbackQueryContext>,
  eventIdStr: string
): Promise<void> {
  const eventId = Number(eventIdStr)
  const { id: userId } = ctx.from

  const participant = GlobalSession.instance.eventData?.participants?.[eventId]

  if (participant === undefined) {
    await ctx.reply(errors.unknownCommand)
    return
  }

  participant.active = false

  await db.updateEventUser(userId, eventId, 0)
  await ctx.reply(texts.eventLeft, {
    reply_markup: {
      inline_keyboard: [[buttons.rejoinEvent(eventId)]],
    },
  })
}

async function rejoinEventHandler(
  ctx: ContextWithSession<CallbackQueryContext>,
  eventIdStr: string
): Promise<void> {
  const eventId = Number(eventIdStr)
  const { id: userId } = ctx.from

  const participant = GlobalSession.instance.eventData?.participants?.[eventId]

  if (participant === undefined) {
    await ctx.reply(errors.unknownCommand)
    return
  }

  participant.active = true

  await db.updateEventUser(userId, eventId, 1)

  // todo reply with current state
  // await ctx.reply(texts.wordsSetAfterStart(minutesLeft))
}

async function eventStatisticsEventHandler(
  ctx: ContextWithSession<CallbackQueryContext>,
  eventIdStr: string
): Promise<void> {
  const eventId = Number(eventIdStr)
  const { id: userId } = ctx.from

  await db.updateEventUser(userId, eventId, 1)

  // todo reply with current state
  // await ctx.reply(texts.wordsSetAfterStart(minutesLeft))
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
    type: MeowsQueryActionType.JoinEvent,
    handler: joinEventHandler,
  },
  {
    type: MeowsQueryActionType.LeaveEvent,
    handler: leaveEventHandler,
  },
  {
    type: MeowsQueryActionType.RejoinEvent,
    handler: rejoinEventHandler,
  },
  {
    type: MeowsQueryActionType.Statistics,
    handler: eventStatisticsEventHandler,
  },
  // todo restart current sprint timer
]
