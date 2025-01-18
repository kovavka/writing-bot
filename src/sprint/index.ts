import * as db from './database'
import { TELEGRAM_BOT_TOKEN_MEOWS } from '../shared/variables'
import { WritingBot } from '../shared/bot/bot'
import { texts } from './copy/texts'
import { queryMap } from './actions/queries'
import { SimpleContext, TextMessageContext } from '../shared/bot/context'
import { textInputCommands } from './actions/chains'
import { errors } from './copy/errors'
import { commands } from './actions/commands'
import { Telegraf } from 'telegraf'
import { initSession, isValidNumber } from '../shared/bot/utils'
import { GlobalSession } from './global-session'
import { sprintFinalWordsHandler } from './actions/shared'
import { buttons } from './copy/buttons'

const bot = new Telegraf(TELEGRAM_BOT_TOKEN_MEOWS)

async function startHandler(ctx: SimpleContext): Promise<void> {
  initSession(ctx)
  const { id: userId, first_name, last_name } = ctx.from

  let welcomeText = ''

  const user = GlobalSession.instance.users.find(x => x.id === userId)
  if (user == null) {
    const userName = last_name === undefined ? first_name : `${first_name} ${last_name}`
    GlobalSession.instance.addUser(userId, userName)
    welcomeText = texts.welcome
  } else {
    // todo add settings
    welcomeText = texts.welcomeBack(user.name)
  }

  const eventData = GlobalSession.instance.eventData
  if (eventData !== undefined) {
    if (eventData.participants[userId] === undefined) {
      await ctx.reply(texts.eventIsRunning(welcomeText), {
        reply_markup: {
          inline_keyboard: [[buttons.joinEvent(eventData.eventId)]],
        },
      })
    } else {
      // rare case when user joined the event, banned the bot and then started again
      await ctx.reply(welcomeText)
    }
  } else {
    await ctx.reply(texts.noEvent(welcomeText))
  }
}

async function textInputFallback(ctx: TextMessageContext): Promise<void> {
  if (GlobalSession.instance.eventData === undefined) {
    await ctx.reply(errors.unknownCommand)
  } else {
    const userInput = ctx.message.text

    if (!isValidNumber(userInput)) {
      await ctx.reply(errors.numberInvalid)
    } else {
      await sprintFinalWordsHandler(initSession(ctx), Number(userInput))
    }
  }
}

new WritingBot(bot, errors)
  .setStart(startHandler)
  .setCommands(commands)
  .setQueries(queryMap)
  .setChainActions(textInputCommands, textInputFallback)

async function launch(): Promise<void> {
  const users = await db.getAllUsers()
  GlobalSession.init(bot, users, undefined)
  await bot.launch(() => {
    GlobalSession.instance.sendToAdmin('bot started')
  })
  console.log('Meows is running...')
}

launch()

process.on('SIGINT', () => {
  db.close()
  process.exit() // Ensure the process exits
})
