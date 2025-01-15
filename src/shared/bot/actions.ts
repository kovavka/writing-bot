import {
  CallbackQueryContext,
  CommandMessageContext,
  ContextWithSession,
  TextMessageContext,
} from './context'
import { InlineKeyboardButton } from '../copy/types'

export type BotCommand = {
  command: string
  admin?: boolean
  handler: (ctx: CommandMessageContext) => Promise<void>
}

export type SendMessageType<QueryType extends string, ChainType extends string> = (
  userIds: number[],
  text: string,
  buttons: InlineKeyboardButton<QueryType>[],
  nextChain?: ChainType
) => Promise<void>

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
        sendMessage: SendMessageType<QueryType, ChainType>,
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
