import { ContextWithSession } from '../../shared/bot/context'
import { MeowsQueryActionType, MeowsTextChainType } from '../types'
import { BotQueryAction } from '../../shared/bot/actions'
import { texts } from '../copy/texts'
import * as db from '../database'

async function createEventHandler(ctx: ContextWithSession): Promise<void> {
  await ctx.reply(texts.setEventDate)
}

async function openEventHandler(
  ctx: ContextWithSession,
  sendMessage: (userIds: number[], text: string) => Promise<void>,
  eventIdStr: string
): Promise<void> {
  const eventId = Number(eventIdStr)

  await ctx.reply(texts.eventNotificationStarted)
  const users = await db.getUsers()

  console.log(users)

  await sendMessage(
    users.map(x => x.id),
    'Event announced'
  )

  await db.updateEventStatus(eventId, 'open')

  await ctx.reply(texts.eventOpened)
}

async function registerHandler(ctx: ContextWithSession): Promise<void> {
  await ctx.reply(texts.register)
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
]
