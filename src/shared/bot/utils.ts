import { ContextWithSession } from './context'
import { TextChainSessionData } from './actions'

export function startNewChain<T extends string>(ctx: ContextWithSession, type: T): void {
  const { id: userId } = ctx.from
  ctx.session[userId] = <TextChainSessionData<T>>{
    ...(ctx.session[userId] ?? {}),
    type: type,
    stageIndex: 0,
  }
}

export function isValidString(userInput: string): boolean {
  return userInput != null && !/('|--|;)/.test(userInput)
}

// todo check max value
export function isValidNumber(userInput: string): boolean {
  return userInput.length > 0 && /^\d+$/.test(userInput) && !isNaN(Number(userInput))
}
