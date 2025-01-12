import { ContextWithSession } from '../../shared/bot/context'
import { MeowsQueryActionType, MeowsTextChainType } from '../types'
import { BotQueryAction } from '../../shared/bot/actions'

async function registerHandler(ctx: ContextWithSession): Promise<void> {}

export const queryMap: BotQueryAction<MeowsQueryActionType, MeowsTextChainType>[] = [
  {
    type: MeowsQueryActionType.Register,
    handler: registerHandler,
  },
]
