import { CommandMessageContext, SimpleContext } from '../../shared/bot/context'
import { texts } from '../copy/texts'
import { TIME_ZONE } from '../../shared/variables'
import { getToday } from '../../shared/date'
import { BotCommand } from '../../shared/bot/actions'
import { buttons } from '../copy/buttons'
import { sprintFinalWordsHandler } from './shared'
import { initSession, isValidNumber } from '../../shared/bot/utils'
import { errors } from '../copy/errors'
import * as db from '../database'
import { MeowsQueryActionType } from '../types'

async function statusHandler(ctx: SimpleContext): Promise<void> {
  const time = getToday().tz(TIME_ZONE).format('HH:mm:ss')

  await ctx.reply(`${texts.status}\nВремя: ${time}`)
}

async function helpHandler(ctx: CommandMessageContext): Promise<void> {
  await ctx.reply(texts.help)
}

async function adminHandler(ctx: CommandMessageContext): Promise<void> {
  await ctx.reply(texts.admin, {
    reply_markup: {
      inline_keyboard: [[buttons.createEvent]],
    },
  })
}

async function wordsHandler(ctx: CommandMessageContext): Promise<void> {
  const messageText = ctx.message.text
  const [, userInput] = messageText.split(' ')

  if (!isValidNumber(userInput)) {
    await ctx.reply(errors.numberInvalid)
  } else {
    await sprintFinalWordsHandler(initSession(ctx), Number(userInput))
  }
}

async function startedEventsHandler(ctx: CommandMessageContext): Promise<void> {
  const events = await db.getAllEvents('started')

  await ctx.reply('Все события', {
    reply_markup: {
      inline_keyboard: events.map(row => [
        {
          text: row.startDateTime,
          callback_data: `${MeowsQueryActionType.SelectEvent}_${row.id}`,
        },
      ]),
    },
  })
}

async function finishedEventsHandler(ctx: CommandMessageContext): Promise<void> {
  const events = await db.getAllEvents('finished')

  await ctx.reply('Завершённые события', {
    reply_markup: {
      inline_keyboard: events.map(row => [
        {
          text: row.startDateTime,
          callback_data: `${MeowsQueryActionType.SelectEvent}_${row.id}`,
        },
      ]),
    },
  })
}

async function settingsHandler(ctx: SimpleContext): Promise<void> {
  await ctx.reply(texts.settings, {
    reply_markup: {
      inline_keyboard: [[buttons.changeName]],
    },
  })
}

export const commands: BotCommand[] = [
  {
    command: 'status',
    handler: statusHandler,
  },
  {
    command: 'help',
    handler: helpHandler,
  },
  {
    command: 'words',
    handler: wordsHandler,
  },
  {
    command: 'settings',
    handler: settingsHandler,
  },
  {
    command: 'admin',
    admin: true,
    handler: adminHandler,
  },
  {
    command: 'events',
    admin: true,
    handler: startedEventsHandler,
  },
  {
    command: 'eventsFinished',
    admin: true,
    handler: finishedEventsHandler,
  },
]
