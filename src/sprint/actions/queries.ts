import { ContextWithSession } from '../../shared/bot/context'
import { MeowsQueryActionType, MeowsTextChainType } from '../types'
import { BotQueryAction } from '../../shared/bot/actions'
import { texts } from '../copy/texts'
import * as db from '../database'

async function createEventHandler(ctx: ContextWithSession): Promise<void> {
  await ctx.reply(texts.setEventDate)
}

async function openEventHandler(ctx: ContextWithSession, eventIdStr: string): Promise<void> {
  const eventId = Number(eventIdStr)

  await ctx.reply(texts.eventNotificationStarted)

  // this.bot.telegram.sendMessage(userId, `Something went wrong. ${err}`)

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
    handler: openEventHandler,
  },
  {
    type: MeowsQueryActionType.Register,
    handler: registerHandler,
  },
]
