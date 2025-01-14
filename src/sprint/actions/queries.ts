import { CallbackQueryContext, ContextWithSession } from '../../shared/bot/context'
import { MeowsQueryActionType, MeowsTextChainType } from '../types'
import { BotQueryAction } from '../../shared/bot/actions'
import { texts } from '../copy/texts'
import * as db from '../database'
import { stringToDateTime } from '../../shared/date'
import { ADMIN_ID } from '../../shared/variables'
import { InlineKeyboardButton } from '../../shared/copy/types'
import { buttons } from '../copy/buttons'

async function createEventHandler(ctx: ContextWithSession): Promise<void> {
  await ctx.reply(texts.setEventDateTime)
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

  await db.updateEventStatus(eventId, 'open')
  await ctx.reply(texts.eventOpened)
}

async function registerHandler(
  ctx: ContextWithSession<CallbackQueryContext>,
  eventIdStr: string
): Promise<void> {
  const { id: userId } = ctx.from
  const eventId = Number(eventIdStr)

  console.log(userId, eventId)
  await db.registerToEvent(userId, eventId)
  ctx.editMessageReplyMarkup(undefined)
  await ctx.reply(texts.registered)
}

async function joinEventHandler(
  ctx: ContextWithSession<CallbackQueryContext>,
  eventIdStr: string
): Promise<void> {
  const { id: userId } = ctx.from
  const eventId = Number(eventIdStr)

  // todo
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
  },
]
