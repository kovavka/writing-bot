import { CommandMessageContext, SimpleContext } from '../../shared/bot/context'
import { texts } from '../copy/texts'
import { TIME_ZONE } from '../../shared/variables'
import { getToday } from '../../shared/date'
import { BotCommand } from '../../shared/bot/actions'
import { buttons } from '../copy/buttons'
import { sprintFinalWordsHandler } from './shared'
import { initSession, isValidNumber } from '../../shared/bot/utils'
import { errors } from '../copy/errors'

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
    command: 'admin',
    admin: true,
    handler: adminHandler,
  },
  {
    command: 'words',
    handler: wordsHandler,
  },
]
