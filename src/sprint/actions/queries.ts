import { CallbackQueryContext, ContextWithSession } from '../../shared/bot/context'
import { MeowsQueryActionType, MeowsTextChainType } from '../types'
import { BotQueryAction, SendMessageType } from '../../shared/bot/actions'
import { texts } from '../copy/texts'
import * as db from '../database'
import { Event } from '../database/types'
import { getToday, stringToDateTime } from '../../shared/date'
import { ADMIN_ID, DATE_TIME_FORMAT } from '../../shared/variables'
import { buttons } from '../copy/buttons'
import { Moment } from 'moment-timezone'
import { delayUntil } from '../time-utils'
import {
  EventDataType,
  GlobalSession,
  ParticipantsData,
  SprintData,
  SprintResultData,
} from '../global-session'
import {
  DEFAULT_BREAK_DURATION,
  LONGER_BREAK_DURATION,
  LUNCH_BREAK_AFTER,
  LUNCH_BREAK_DURATION,
} from '../variables'
import { startNewChain } from '../../shared/bot/utils'
import { errors } from '../copy/errors'
import { getWordForm } from '../../shared/get-word-form'
import { forms } from '../../shared/copy/forms'
import { replyWithCurrentState } from './shared'

async function createEventHandler(ctx: ContextWithSession): Promise<void> {
  await ctx.reply(texts.setEventDateTime)
}

function getSprintStat(sprintIndex: number, sprintDuration: number): string {
  const currentSprint = GlobalSession.instance.eventData!.sprints[sprintIndex]
  const users = GlobalSession.instance.users

  const currentSprintResult = Object.entries(currentSprint.results).reduce(
    (data: Array<{ userName: string; diff: number }>, [userIdStr, result]) => {
      const userId = Number(userIdStr)
      const user = users.find(x => x.id === userId)

      return [
        ...data,
        {
          userName: user?.name ?? userId.toString(),
          diff: result?.diff ?? 0,
        },
      ]
    },
    []
  )

  const participants = GlobalSession.instance.eventData!.participants
  users.forEach(user => {
    // active participant who didn't submit the result
    if (currentSprint.results[user.id] === undefined && participants[user.id]?.active) {
      currentSprintResult.push({
        userName: user.name,
        diff: 0,
      })
    }
  })

  return currentSprintResult
    .sort((a, b) => b.diff - a.diff)
    .map(result => {
      let line = `${result.userName} – ${result.diff} ${getWordForm(result.diff, forms.words)}`
      if (result.diff > 0) {
        line += ` _(${Math.round(result.diff / sprintDuration)} слов/мин)_`
      }
      return line
    })
    .join('\n')
}

function getActiveUserIds(): number[] {
  return Object.entries(GlobalSession.instance.eventData!.participants)
    .filter(([, data]) => data?.active)
    .map(([id]) => Number(id))
}

function getCurrentBreakDuration(sprintIndex: number): number {
  if (LUNCH_BREAK_AFTER.includes(sprintIndex + 1)) {
    return LUNCH_BREAK_DURATION
  }
  return sprintIndex % 3 === 2 ? LONGER_BREAK_DURATION : DEFAULT_BREAK_DURATION
}

async function runSprints(
  eventData: EventDataType,
  sprintDuration: number,
  startSprintId: number,
  startMoment: Moment,
  sendMessage: SendMessageType<MeowsQueryActionType>
): Promise<void> {
  const { eventId, sprintsNumber, sprintIndex: sprintIndexStart } = eventData

  let sprintId = startSprintId
  let sprintStartMoment = startMoment
  for (let i = sprintIndexStart; i < sprintsNumber; i++) {
    eventData.sprintIndex = i
    const breakDuration = getCurrentBreakDuration(i)
    const sprintEndMoment = sprintStartMoment.clone().add(sprintDuration, 'minutes')

    eventData.sprints.push({
      id: sprintId,
      startMoment: sprintStartMoment,
      endMoment: sprintEndMoment,
      results: {},
    })

    await delayUntil(sprintStartMoment)

    // sprint started
    eventData.sprintStatus = 'sprint'
    eventData.nextStageMoment = sprintEndMoment

    await sendMessage(
      getActiveUserIds(),
      texts.sprintStarted(i + 1, sprintDuration, sprintEndMoment),
      []
    )

    await delayUntil(sprintEndMoment)
    // sprint just finished

    // getting users again in case someone joined after the sprint started
    const nextActiveUserIds = getActiveUserIds()

    const isLastSprint = i === sprintsNumber - 1
    if (isLastSprint) {
      eventData.sprintStatus = 'lastSprintFinished'
      await sendMessage(nextActiveUserIds, texts.sprintFinishedLast, [])
    } else {
      eventData.sprintStatus = 'break'
      sprintStartMoment = sprintEndMoment.clone().add(breakDuration, 'minutes')

      eventData.nextStageMoment = sprintStartMoment

      sprintId = await db.createSprint(eventId, sprintStartMoment.format(DATE_TIME_FORMAT))
      await sendMessage(
        nextActiveUserIds,
        texts.sprintFinished(breakDuration, sprintStartMoment),
        []
      )
    }

    const resultLatestMoment = sprintEndMoment
      .clone()
      .add(DEFAULT_BREAK_DURATION * 60 - 30, 'seconds')

    await delayUntil(resultLatestMoment)

    const sprintStat = getSprintStat(i, sprintDuration)

    await sendMessage(nextActiveUserIds, texts.sprintResult(i + 1, sprintStat), [])
  }

  await sendMessage([Number(ADMIN_ID)], `Последний спринт завершён. eventId = ${eventId}`, [
    buttons.eventStat(eventId),
    buttons.finishEvent(eventId),
  ])
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
    sprintStatus: 'break',
    nextStageMoment: eventStartMoment,
    sprints: [],
    participants: {},
  }

  const minutesLeft = eventStartMoment.diff(getToday(), 'minutes')

  await sendMessage(userIds, texts.eventStartingSoon(minutesLeft, eventStartMoment), [
    buttons.joinEvent(event.id),
  ])

  await runSprints(
    GlobalSession.instance.eventData!,
    event.sprintDuration,
    firstSprintId,
    eventStartMoment,
    sendMessage
  )
}

async function openEvent(
  event: Event,
  sendMessage: SendMessageType<MeowsQueryActionType>
): Promise<void> {
  const eventStartMoment = stringToDateTime(event.startDateTime)
  const notificationMoment = eventStartMoment.subtract(40, 'minutes')

  await delayUntil(notificationMoment)

  await sendMessage([Number(ADMIN_ID)], texts.eventNotificationStarted, [])

  await startEvent(event, sendMessage)
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
  sendMessage: SendMessageType<MeowsQueryActionType>,
  eventIdStr: string
): Promise<void> {
  const eventId = Number(eventIdStr)

  await ctx.reply(texts.adminEventOpened)
  const event = await getEventById(eventId)

  // should run in background, never use await here
  openEvent(event, sendMessage)
}

async function joinEventHandler(
  ctx: ContextWithSession<CallbackQueryContext>,
  eventIdStr: string
): Promise<void> {
  const eventId = Number(eventIdStr)
  const { id: userId } = ctx.from

  if (
    GlobalSession.instance.eventData === undefined ||
    GlobalSession.instance.eventData.eventId !== eventId
  ) {
    await ctx.reply(texts.eventIsAlreadyFinished)
    return
  }

  const { eventStatus } = GlobalSession.instance.eventData

  if (eventStatus === 'finished') {
    await ctx.reply(texts.eventIsAlreadyFinished)
    return
  }

  const participant = GlobalSession.instance.eventData.participants[userId]

  if (participant === undefined) {
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

  if (
    GlobalSession.instance.eventData === undefined ||
    GlobalSession.instance.eventData.eventId !== eventId
  ) {
    console.log('eventId')
    await ctx.reply(texts.eventIsAlreadyFinished)
    return
  }

  const { eventStatus } = GlobalSession.instance.eventData

  if (eventStatus === 'finished') {
    console.log('finished')
    await ctx.reply(texts.eventIsAlreadyFinished)
    return
  }

  const participant = GlobalSession.instance.eventData.participants[userId]

  if (participant === undefined) {
    console.log('undefined participant')
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

  if (
    GlobalSession.instance.eventData === undefined ||
    GlobalSession.instance.eventData.eventId !== eventId
  ) {
    await ctx.reply(texts.eventIsAlreadyFinished)
    return
  }

  const { eventStatus, sprintStatus } = GlobalSession.instance.eventData

  if (eventStatus === 'finished' || sprintStatus === 'lastSprintFinished') {
    await ctx.reply(texts.eventIsAlreadyFinished)
    return
  }

  const participant = GlobalSession.instance.eventData.participants[userId]

  if (participant === undefined) {
    await ctx.reply(errors.unknownCommand)
    return
  }

  participant.active = true

  await replyWithCurrentState(ctx, GlobalSession.instance.eventData, texts.rejoin)

  // save to db as a backup
  await db.updateEventUser(userId, eventId, 1)
}

async function eventStatisticsHandler(
  ctx: ContextWithSession<CallbackQueryContext>,
  eventIdStr: string
): Promise<void> {
  const eventId = Number(eventIdStr)

  const [event, allParticipants, data] = await Promise.all([
    getEventById(eventId),
    db.getEventUsers(eventId),
    db.getEventStat(eventId),
  ])

  const userResults: Record<
    number,
    {
      userName: string
      diff: number
    }
  > = []

  data.forEach(({ userId, userName, startWords, finalWords }) => {
    if (userResults[userId] === undefined) {
      userResults[userId] = {
        userName,
        diff: 0,
      }
    }
    if (finalWords > startWords) {
      userResults[userId].diff += finalWords - startWords
    }
  })

  const wordsTotal = Object.values(userResults).reduce(
    (partialSum, a) => partialSum + a.diff,
    0
  )
  const strStat = Object.values(userResults)
    .sort((a, b) => b.diff - a.diff)
    .map(
      result => `${result.userName} – ${result.diff} ${getWordForm(result.diff, forms.words)}`
    )
    .join('\n')

  await ctx.reply(
    texts.eventStat(event.sprintsNumber, allParticipants.length, wordsTotal, strStat)
  )
}

async function finishEventHandler(
  ctx: ContextWithSession<CallbackQueryContext>,
  eventIdStr: string
): Promise<void> {
  const eventId = Number(eventIdStr)

  if (
    GlobalSession.instance.eventData !== undefined &&
    GlobalSession.instance.eventData.eventId === eventId
  ) {
    GlobalSession.instance.eventData = undefined
  }

  await db.updateEventStatus(eventId, 'finished')
  await ctx.reply(`Событие №${eventId} завершено`)
}

async function selectEventHandler(
  ctx: ContextWithSession<CallbackQueryContext>,
  eventIdStr: string
): Promise<void> {
  const eventId = Number(eventIdStr)
  const event = await getEventById(eventId)

  const message = `Событие ${event.startDateTime} id = ${eventId}`
  if (event.status === 'finished') {
    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [[buttons.eventStat(eventId)]],
      },
    })
  } else {
    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [
          [buttons.eventStat(eventId), buttons.finishEvent(eventId)],
          [buttons.eventSchedule(eventId)],
          [buttons.startLatestSprint(eventId)],
        ],
      },
    })
  }
}

async function eventScheduleHandler(
  ctx: ContextWithSession<CallbackQueryContext>,
  eventIdStr: string
): Promise<void> {
  const eventId = Number(eventIdStr)
  const event = await getEventById(eventId)

  const scheduleList: string[] = []

  let start = stringToDateTime(event.startDateTime)
  for (let i = 0; i < event.sprintsNumber; i++) {
    const end = start.clone().add(25, 'minutes')

    const breakDuration = getCurrentBreakDuration(i)

    let schedule = `${i >= 9 ? i + 1 : '0' + (i + 1)}. ${start.format('HH:mm')} - ${end.format('HH:mm')}`

    if (i + 1 !== event.sprintsNumber) {
      schedule += `, перерыв: ${breakDuration} минут`
      start = end.clone().add(breakDuration, 'minutes')
    }

    scheduleList.push(schedule)
  }

  await ctx.reply(scheduleList.join('\n'))
}

async function startLatestSprintHandler(
  ctx: ContextWithSession<CallbackQueryContext>,
  sendMessage: SendMessageType<MeowsQueryActionType>,
  eventIdStr: string
): Promise<void> {
  if (GlobalSession.instance.eventData !== undefined) {
    await ctx.reply(errors.generic)
    return
  }

  const eventId = Number(eventIdStr)
  const [event, allSprints, eventUsers, eventStat] = await Promise.all([
    getEventById(eventId),
    db.getAllSprints(eventId),
    db.getEventUsers(eventId),
    db.getEventStat(eventId),
  ])

  if (allSprints.length === 0) {
    await ctx.reply(errors.generic)
    return
  }

  const participants = eventUsers.reduce<Record<number, ParticipantsData>>((acc, eventUser) => {
    return {
      ...acc,
      [eventUser.userId]: {
        startWords: eventUser.startWords ?? 0,
        active: eventUser.active === 1,
      },
    }
  }, {})

  const sprintNewStart = getToday().add('30', 'seconds')
  // todo update startMoment in db?

  const allResults = eventStat.reduce<Record<number, Record<number, SprintResultData>>>(
    (acc, data) => {
      return {
        ...acc,
        [data.sprintId]: {
          ...(acc[data.sprintId] ?? {}),
          [data.userId]: {
            startWords: data.startWords,
            finalWords: data.finalWords,
            diff: data.finalWords - data.startWords,
          },
        },
      }
    },
    {}
  )

  // last one would be added automatically after setting timer
  const sprintsData: SprintData[] = allSprints.slice(0, allSprints.length - 1).map(sprint => {
    return {
      id: sprint.id,
      startMoment: sprintNewStart,
      endMoment: sprintNewStart,
      results: allResults[sprint.id] ?? {},
    }
  })
  // todo cleanup latest sprint result in db

  GlobalSession.instance.eventData = {
    eventId: event.id,
    eventStatus: 'started',
    sprintsNumber: event.sprintsNumber,
    sprintIndex: allSprints.length - 1,
    sprintStatus: 'break',
    nextStageMoment: sprintNewStart,
    sprints: sprintsData,
    participants,
  }

  // should run in background, never use await here
  runSprints(
    GlobalSession.instance.eventData!,
    event.sprintDuration,
    allSprints[allSprints.length - 1].id,
    sprintNewStart,
    sendMessage
  )

  await ctx.reply('Запускаю...')
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
    type: MeowsQueryActionType.EventStat,
    handler: eventStatisticsHandler,
  },
  {
    type: MeowsQueryActionType.FinishEvent,
    handler: finishEventHandler,
  },
  {
    type: MeowsQueryActionType.SelectEvent,
    handler: selectEventHandler,
  },
  {
    type: MeowsQueryActionType.EventSchedule,
    handler: eventScheduleHandler,
  },
  {
    type: MeowsQueryActionType.StartLatestSprint,
    handlerType: 'allow_global',
    handler: startLatestSprintHandler,
  },
  {
    type: MeowsQueryActionType.ChangeName,
    handler: async (ctx: ContextWithSession): Promise<void> => {
      await ctx.reply(texts.changeName)
    },
    chainCommand: MeowsTextChainType.ChangeName,
  },
]
