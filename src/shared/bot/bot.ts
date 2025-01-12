import { ADMIN_ID } from '../variables'
import {
  CallbackQueryContext,
  ContextWithSession,
  SimpleContext,
  TextMessageContext,
} from './context'
import { Context, session, Telegraf } from 'telegraf'
import { Update } from 'telegraf/typings/core/types/typegram'
import { callbackQuery } from 'telegraf/filters'
import { initSession, isValidNumber, isValidString, startNewChain } from './utils'
import { BotCommand, BotQueryAction, BotTextChainAction, TextChainSessionData } from './actions'
import { ErrorMessage } from '../copy/types'

function isAdmin(ctx: SimpleContext): boolean {
  const { id: userId } = ctx.from
  return userId.toString() === ADMIN_ID
}

function clearSession<T extends SimpleContext>(ctx: T): void {
  const { id: userId } = ctx.from

  if (ctx.session != null) {
    ctx.session[userId] = {}
  }
}

export class WritingBot<QueryType extends string, ChainType extends string> {
  private bot: Telegraf<Context<Update>>
  private errors: ErrorMessage

  constructor(bot: Telegraf<Context<Update>>, errors: ErrorMessage) {
    this.bot = bot
    this.bot.use(session())
    this.errors = errors
  }

  private sendErrorToAdmin(err: unknown): void {
    this.bot.telegram.sendMessage(ADMIN_ID, `Something went wrong. ${err}`)
  }

  // public for tests only
  async commandCallback(
    ctx: SimpleContext,
    handler: (ctx: SimpleContext) => Promise<void>,
    needsAdminPermissions?: boolean
  ): Promise<void> {
    try {
      clearSession(ctx)

      // if user has permissions to run the command
      if (needsAdminPermissions !== true || !isAdmin(ctx)) {
        await handler(ctx)
      } else {
        await ctx.reply(this.errors.unknownCommand)
      }
    } catch (err: unknown) {
      ctx.reply(this.errors.generic)
      this.sendErrorToAdmin(err)
    }
  }

  setCommands(commands: BotCommand[]): WritingBot<QueryType, ChainType> {
    commands.forEach(item => {
      this.bot.command(item.command, async ctx => {
        await this.commandCallback(ctx, item.handler, item.admin)
      })
    })
    return this
  }

  // public for tests only
  async callbackQueryHandler(
    ctx: CallbackQueryContext,
    queries: BotQueryAction<QueryType, ChainType>[]
  ): Promise<void> {
    try {
      clearSession(ctx)
      if (!ctx.has(callbackQuery('data'))) {
        await ctx.reply(this.errors.generic)
        return
      }
      const command = ctx.callbackQuery.data
      const sessionContext = initSession(ctx)

      const queryCommand = queries.find(x => command.startsWith(x.type))
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
        await ctx.reply(this.errors.unknownCommand)
        await ctx.answerCbQuery()
      }
    } catch (err) {
      ctx.reply(this.errors.generic)
      this.sendErrorToAdmin(err)
      ctx.answerCbQuery()
    }
  }

  setQueries(
    queries: BotQueryAction<QueryType, ChainType>[]
  ): WritingBot<QueryType, ChainType> {
    this.bot.on('callback_query', async ctx => {
      await this.callbackQueryHandler(ctx, queries)
    })
    return this
  }

  private async executeChainCommand<SessionData extends TextChainSessionData<ChainType>>(
    command: BotTextChainAction<ChainType, SessionData>,
    ctx: ContextWithSession<TextMessageContext>,
    sessionData: SessionData
  ): Promise<void> {
    const userInput = ctx.message.text

    const currentStage = command.stages[sessionData.stageIndex]
    if (currentStage === undefined) {
      return Promise.reject()
    }

    if (currentStage.inputType === 'number') {
      if (!isValidNumber(userInput)) {
        await ctx.reply(this.errors.numberInvalid)
        return
      }

      const value = Number(userInput)
      await currentStage.handler(ctx, value, sessionData)
    } else {
      if (!isValidString(userInput)) {
        await ctx.reply(this.errors.stringInvalid)
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

  // public for tests only
  async textInputHandler<SessionData extends TextChainSessionData<ChainType>>(
    ctx: TextMessageContext,
    chainActions: BotTextChainAction<ChainType, SessionData>[]
  ): Promise<void> {
    try {
      const { id: userId } = ctx.from

      const sessionContext = initSession(ctx)

      const sessionData = sessionContext.session[userId] as SessionData

      if (sessionData == null || sessionData.type == null || sessionData.stageIndex == null) {
        await ctx.reply(this.errors.unknownCommand)
        return
      }

      const textCommand = chainActions.find(x => x.type === sessionData.type)
      if (textCommand !== undefined) {
        await this.executeChainCommand(textCommand, sessionContext, sessionData)
      } else {
        await ctx.reply(this.errors.unknownCommand)
      }
    } catch (err) {
      ctx.reply(this.errors.generic)
      this.sendErrorToAdmin(err)
    }
  }

  setChainActions<SessionData extends TextChainSessionData<ChainType>>(
    chainActions: BotTextChainAction<ChainType, SessionData>[]
  ): WritingBot<QueryType, ChainType> {
    this.bot.on('text', async ctx => {
      await this.textInputHandler(ctx, chainActions)
    })
    return this
  }

  // public for tests only
  async startCallback(
    ctx: SimpleContext,
    handler: (ctx: SimpleContext) => Promise<void>
  ): Promise<void> {
    try {
      clearSession(ctx)
      await handler(ctx)
    } catch (err: unknown) {
      ctx.reply(this.errors.generic)
      this.sendErrorToAdmin(err)
    }
  }

  setStart(handler: (ctx: SimpleContext) => Promise<void>): WritingBot<QueryType, ChainType> {
    this.bot.start(async ctx => {
      await this.startCallback(ctx, handler)
    })
    return this
  }
}
