import {
  CallbackQueryContext,
  ContextWithSession,
  SimpleContext,
  TextMessageContext,
} from './context'
import { InlineKeyboardButton } from '../copy/types'

export type BotCommand = {
  command: string
  admin?: boolean
  handler: (ctx: SimpleContext) => Promise<void>
}

export type BotQueryAction<QueryType extends string, ChainType extends string> =
  | {
      type: QueryType
      handlerType?: 'generic'
      handler: (
        ctx: ContextWithSession<CallbackQueryContext>,
        ...params: string[]
      ) => Promise<void>
      chainCommand?: ChainType
    }
  | {
      type: QueryType
      handlerType: 'allow_global'
      handler: (
        ctx: ContextWithSession<CallbackQueryContext>,
        sendMessage: (
          userIds: number[],
          text: string,
          buttons: InlineKeyboardButton<QueryType>[]
        ) => Promise<void>,
        ...params: string[]
      ) => Promise<void>
      chainCommand?: ChainType
    }

export type TextChainSessionData<ChainType extends string> = {
  type: ChainType
  stageIndex: number
}

type ChainStage<SessionData> =
  | {
      inputType: 'number'
      handler: (
        ctx: ContextWithSession<TextMessageContext>,
        userInput: number,
        sessionData: SessionData
      ) => Promise<void>
    }
  | {
      inputType: 'string'
      handler: (
        ctx: ContextWithSession<TextMessageContext>,
        userInput: string,
        sessionData: SessionData
      ) => Promise<void>
    }

export type BotTextChainAction<
  ChainType extends string,
  SessionData extends TextChainSessionData<ChainType>,
> = {
  type: ChainType
  stages: ChainStage<SessionData>[]
}
