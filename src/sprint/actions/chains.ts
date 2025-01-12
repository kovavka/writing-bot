import { ContextWithSession } from '../../shared/bot/context'
import { MeowsTextChainType } from '../types'
import { BotTextChainAction, TextChainSessionData } from '../../shared/bot/actions'

type BaseSessionData = TextChainSessionData<MeowsTextChainType>

async function wordsStartHandler(
  ctx: ContextWithSession,
  words: number,
  sessionData: BaseSessionData
): Promise<void> {}

export const textInputCommands: BotTextChainAction<MeowsTextChainType, BaseSessionData>[] = [
  {
    type: MeowsTextChainType.SetWordsStart,
    stages: [
      {
        inputType: 'number',
        handler: wordsStartHandler,
      },
    ],
  },
]
