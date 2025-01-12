import { SimpleContext } from '../../shared/bot/context'
import { texts } from '../copy/texts'
import { TIME_ZONE } from '../../shared/variables'
import { getToday } from '../../shared/date'
import { BotCommand } from '../../shared/bot/actions'

async function statusHandler(ctx: SimpleContext): Promise<void> {
  const time = getToday().tz(TIME_ZONE).format('HH:mm:ss')

  await ctx.reply(`${texts.status}\nВремя: ${time}`)
}

async function helpHandler(ctx: SimpleContext): Promise<void> {
  // await ctx.reply(texts.help, {
  //   reply_markup: {
  //     inline_keyboard: [[buttons.newProject, buttons.allProjects]],
  //   },
  // })
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
]
