import { ContextWithSession, SimpleContext } from './context'
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
  return userInput.length > 0 && !/('|--|;)/.test(userInput)
}

// todo check max value
export function isValidNumber(userInput: string): boolean {
  return (
    userInput.length > 0 &&
    userInput.length < 9 &&
    /^\d+$/.test(userInput) &&
    !isNaN(Number(userInput))
  )
}

export function initSession<T extends SimpleContext>(ctx: T): ContextWithSession<T> {
  if (ctx.session == null) {
    ctx.session = {}
  }

  return ctx as ContextWithSession<T>
}
