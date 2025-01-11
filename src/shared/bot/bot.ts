import { ADMIN_ID } from '../variables'
import { ContextWithSession, SimpleContext, TextMessageContext } from './context'
import { Telegraf, Context, session } from 'telegraf'
import { Update } from 'telegraf/typings/core/types/typegram'
import { callbackQuery } from 'telegraf/filters'
import { isValidNumber, isValidString, startNewChain } from './utils'
import { BotCommand, BotQueryAction, BotTextChainAction, TextChainSessionData } from './actions'
import { ErrorMessage } from '../copy/types'

export function isAdmin(ctx: SimpleContext): boolean {
  const { id: userId } = ctx.from
  return userId.toString() === ADMIN_ID
}

export function initSession<T extends SimpleContext>(ctx: T): ContextWithSession<T> {
  if (ctx.session == null) {
    ctx.session = {}
  }

  return ctx as ContextWithSession<T>
}

export function clearSession<T extends SimpleContext>(ctx: T): void {
  const { id: userId } = ctx.from

  if (ctx.session != null) {
    ctx.session[userId] = {}
  }
}

export class WritingBot<QueryType extends string, ChainType extends string> {
  private bot: Telegraf<Context<Update>>
  private errors: ErrorMessage

  constructor(token: string, errors: ErrorMessage) {
    this.bot = new Telegraf(token)
    this.bot.use(session())
    this.errors = errors
  }

  private sendErrorToAdmin(err: unknown): void {
    this.bot.telegram.sendMessage(ADMIN_ID, `Something went wrong. ${err}`).catch(() => {})
  }

  setCommands(commands: BotCommand[]): void {
    commands.forEach(item => {
      this.bot.command(item.command, async ctx => {
        try {
          clearSession(ctx)

          // if user has permissions to run the command
          if (item.admin !== true || !isAdmin(ctx)) {
            await item.handler(ctx)
          } else {
            await ctx.reply(this.errors.unknownCommand)
          }
        } catch (err: unknown) {
          ctx.reply(this.errors.generic)
          this.sendErrorToAdmin(err)
        }
      })
    })
  }

  setQueries(queries: BotQueryAction<QueryType, ChainType>[]): void {
    this.bot.on('callback_query', async ctx => {
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
    })
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

  setChainActions<SessionData extends TextChainSessionData<ChainType>>(
    chainActions: BotTextChainAction<ChainType, SessionData>[]
  ): void {
    this.bot.on('text', async ctx => {
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
    })
  }

  setStart(handler: (ctx: SimpleContext) => Promise<void>): void {
    this.bot.start(async ctx => {
      try {
        clearSession(ctx)
        await handler(ctx)
      } catch (err: unknown) {
        ctx.reply(this.errors.generic)
        this.sendErrorToAdmin(err)
      }
    })
  }

  launch(): void {
    this.bot.launch()
  }
}
