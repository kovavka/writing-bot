import * as db from './database'
import { TELEGRAM_BOT_TOKEN_MEOWS } from '../shared/variables'
import { WritingBot } from '../shared/bot/bot'
import { texts } from './copy/texts'
import { queryMap } from './actions/queries'
import { SimpleContext } from '../shared/bot/context'
import { textInputCommands } from './actions/chains'
import { errors } from './copy/errors'
import { commands } from './actions/commands'
import { Telegraf } from 'telegraf'

const bot = new Telegraf(TELEGRAM_BOT_TOKEN_MEOWS)

async function startHandler(ctx: SimpleContext): Promise<void> {
  await ctx.reply(texts.welcome)
}

new WritingBot(bot, errors)
  .setStart(startHandler)
  .setCommands(commands)
  .setQueries(queryMap)
  .setChainActions(textInputCommands)

bot.launch()
console.log('Meows is running...')

process.on('SIGINT', () => {
  db.close()
  process.exit() // Ensure the process exits
})
