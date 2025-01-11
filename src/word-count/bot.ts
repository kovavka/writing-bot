import { Telegraf, session } from 'telegraf'
import { callbackQuery } from 'telegraf/filters'
import * as db from './database'
import { TELEGRAM_BOT_TOKEN_PERO, ADMIN_ID } from '../shared/variables'
import { initSession, clearSession } from '../shared/utils'
import * as commands from './actions/commands'
import { texts } from './copy/texts'
import { queryMap } from './actions/queries'
import { ContextWithSession, TextMessageContext } from '../shared/types'
import {
  TextChainCommand,
  textInputCommands,
  AnySessionData,
} from './actions/chains'
import { startNewChain } from './actions/commands'
import { buttons } from './copy/buttons'
import { errors } from './copy/errors'

export const bot = new Telegraf(TELEGRAM_BOT_TOKEN_PERO)
bot.use(session())

// todo type
function sendErrorToAdmin(err: unknown): void {
  bot.telegram
    .sendMessage(ADMIN_ID, `Something went wrong. ${err}`)
    .catch(() => {})
}

bot.start(async ctx => {
  try {
    await commands.start(ctx)
  } catch (err) {
    ctx.reply(errors.generic)
    sendErrorToAdmin(err)
  }
})

bot.command('all', ctx => {
  try {
    clearSession(ctx)
    commands.allProjects(ctx)
  } catch (err) {
    ctx.reply(errors.generic)
    sendErrorToAdmin(err)
  }
})

bot.command('help', ctx => {
  try {
    clearSession(ctx)
    ctx.reply(texts.help, {
      reply_markup: {
        inline_keyboard: [[buttons.newProject, buttons.allProjects]],
      },
    })
  } catch (err) {
    ctx.reply(errors.generic)
    sendErrorToAdmin(err)
  }
})

bot.command('settings', ctx => {
  try {
    clearSession(ctx)
    ctx.reply(texts.settings, {
      reply_markup: {
        inline_keyboard: [[buttons.changeName]],
      },
    })
  } catch (err) {
    ctx.reply(errors.generic)
    sendErrorToAdmin(err)
  }
})

bot.command('status', commands.status)

bot.command('stat', async ctx => {
  try {
    clearSession(ctx)
    await commands.adminStat(ctx)
  } catch (err) {
    ctx.reply(errors.generic)
    sendErrorToAdmin(err)
  }
})

bot.command('statToday', ctx => {
  try {
    clearSession(ctx)
    commands.adminStatToday(ctx)
  } catch (err) {
    ctx.reply(errors.generic)
    sendErrorToAdmin(err)
  }
})

bot.on('callback_query', async ctx => {
  try {
    clearSession(ctx)
    if (!ctx.has(callbackQuery('data'))) {
      ctx.reply(errors.generic)
      return
    }

    const command = ctx.callbackQuery.data
    const sessionContext = initSession(ctx)

    const queryCommand = queryMap.find(x => command.startsWith(x.type))
    if (queryCommand !== undefined) {
      const params =
        command.length > queryCommand.type.length + 1
          ? command.substring(queryCommand.type.length + 1).split('_')
          : []
      await queryCommand.handler(sessionContext, ...params)
      if (queryCommand.chainCommand !== undefined) {
        startNewChain(sessionContext, queryCommand.chainCommand)
      }
      await sessionContext.answerCbQuery()
    } else {
      ctx.reply(errors.unknown)
      ctx.answerCbQuery()
    }
  } catch (err) {
    ctx.reply(errors.generic)
    sendErrorToAdmin(err)
    ctx.answerCbQuery()
  }
})

function isValidString(userInput: string): boolean {
  return userInput != null && !/('|--|;)/.test(userInput)
}

function isValidNumber(userInput: string): boolean {
  return (
    userInput.length > 0 && /^\d+$/.test(userInput) && !isNaN(Number(userInput))
  )
}

async function executeChainCommand(
  command: TextChainCommand<AnySessionData>,
  ctx: ContextWithSession<TextMessageContext>,
  sessionData: AnySessionData
): Promise<void> {
  const userInput = ctx.message.text

  const currentStage = command.stages[sessionData.stageIndex]
  if (currentStage === undefined) {
    return Promise.reject()
  }

  if (currentStage.inputType === 'number') {
    if (!isValidNumber(userInput)) {
      await ctx.reply(errors.numberInvalid)
      return
    }

    const value = Number(userInput)
    await currentStage.handler(ctx, value, sessionData)
  } else {
    if (!isValidString(userInput)) {
      await ctx.reply(errors.nameInvalid)
      return
    }

    await currentStage.handler(ctx, userInput, sessionData)
  }

  if (sessionData.stageIndex === command.stages.length - 1) {
    // last stage
    clearSession(ctx)
  } else {
    sessionData.stageIndex++
  }
}

bot.on('text', async ctx => {
  try {
    const { id: userId } = ctx.from

    const sessionContext = initSession(ctx)

    const sessionData = sessionContext.session[userId] as AnySessionData

    if (
      sessionData == null ||
      sessionData.type == null ||
      sessionData.stageIndex == null
    ) {
      await ctx.reply(errors.unknown)
      return
    }

    const textCommand = textInputCommands.find(x => x.type === sessionData.type)
    if (textCommand !== undefined) {
      await executeChainCommand(textCommand, sessionContext, sessionData)
    } else {
      ctx.reply(errors.unknown)
    }
  } catch (err) {
    ctx.reply(errors.generic)
    sendErrorToAdmin(err)
  }
})

console.log('Bot is running...')

process.on('SIGINT', () => {
  db.close()
  process.exit() // Ensure the process exits
})
