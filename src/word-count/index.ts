import * as db from './database'
import { TELEGRAM_BOT_TOKEN_PERO } from '../shared/variables'
import { WritingBot } from '../shared/bot/bot'
import { texts } from './copy/texts'
import { queryMap } from './actions/queries'
import { SimpleContext } from '../shared/bot/context'
import { textInputCommands } from './actions/chains'
import { buttons } from './copy/buttons'
import { errors } from './copy/errors'
import { PeroTextChainType } from './types'
import { initSession, startNewChain } from '../shared/bot/utils'
import { commands } from './actions/commands'
import { Telegraf } from 'telegraf'

const bot = new Telegraf(TELEGRAM_BOT_TOKEN_PERO)

async function startHandler(ctx: SimpleContext): Promise<void> {
  const sessionContext = initSession(ctx)

  const { id: userId, first_name, last_name } = ctx.from

  const user = await db.getUser(userId)
  if (user == null) {
    await db.addUser(userId, `${first_name} ${last_name}`)

    startNewChain(sessionContext, PeroTextChainType.SetName)
    await ctx.reply(texts.welcome)
  } else {
    await ctx.reply(texts.welcomeBack(user.name), {
      reply_markup: {
        inline_keyboard: [[buttons.allProjects]],
      },
    })
  }
}

new WritingBot(bot, errors)
  .setStart(startHandler)
  .setCommands(commands)
  .setQueries(queryMap)
  .setChainActions(textInputCommands)

bot.launch()
console.log('Pero is running...')

process.on('SIGINT', () => {
  db.close()
  process.exit() // Ensure the process exits
})
