import { ContextWithSession, SimpleContext, TextMessageContext } from './context'

export type BotCommand = {
  command: string
  admin?: boolean
  handler: (ctx: SimpleContext) => Promise<void>
}

export type BotQueryAction<QueryType extends string, ChainType extends string> = {
  type: QueryType
  handler: (ctx: ContextWithSession, ...params: string[]) => Promise<void>
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
