import { SimpleContext } from '../../shared/bot/context'
import { texts } from '../copy/texts'
import { TIME_ZONE } from '../../shared/variables'
import { getToday } from '../../shared/date'
import { BotCommand } from '../../shared/bot/actions'
import { buttons } from '../copy/buttons'

async function statusHandler(ctx: SimpleContext): Promise<void> {
  const time = getToday().tz(TIME_ZONE).format('HH:mm:ss')

  await ctx.reply(`${texts.status}\nВремя: ${time}`)
}

async function helpHandler(ctx: SimpleContext): Promise<void> {
  await ctx.reply(texts.help)
}

async function adminHandler(ctx: SimpleContext): Promise<void> {
  await ctx.reply(texts.admin, {
    reply_markup: {
      inline_keyboard: [[buttons.createEvent]],
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
    command: 'admin',
    admin: true,
    handler: adminHandler,
  },
]
