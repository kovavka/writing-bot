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
import { initSession } from '../shared/bot/utils'

const bot = new Telegraf(TELEGRAM_BOT_TOKEN_MEOWS)

async function startHandler(ctx: SimpleContext): Promise<void> {
  initSession(ctx)
  const { id: userId, first_name, last_name } = ctx.from

  const user = await db.getUser(userId)
  if (user == null) {
    await db.addUser(userId, `${first_name} ${last_name}`)

    await ctx.reply(texts.welcome)
  } else {
    // add settings
    await ctx.reply(texts.welcomeBack(user.name))
  }
}

new WritingBot(bot, errors)
  .setStart(startHandler)
  .setCommands(commands)
  .setQueries(queryMap)
  .setChainActions(textInputCommands)

// get event & sprint
// eventData = {}

bot.launch()
console.log('Meows is running...')

process.on('SIGINT', () => {
  db.close()
  process.exit() // Ensure the process exits
})
