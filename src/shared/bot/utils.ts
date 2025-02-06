import { ContextWithSession, SimpleContext } from './context'
import { TextChainSessionData } from './actions'
import { DATE_FORMAT_INPUT, TIME_ZONE } from '../../shared/variables'

import moment from 'moment-timezone'

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

export function isValidNumber(userInput: string): boolean {
  return (
    userInput.length > 0 &&
    userInput.length < 9 &&
    /^\d+$/.test(userInput) &&
    !isNaN(Number(userInput))
  )
}

export function isValidDate(userInput: string): boolean {
  if (!/^\d\d.\d\d.\d\d$/.test(userInput)) {
    return false
  }

  const date = moment.tz(userInput, DATE_FORMAT_INPUT, TIME_ZONE)

  return date.isValid()
}

export function initSession<T extends SimpleContext>(ctx: T): ContextWithSession<T> {
  if (ctx.session == null) {
    ctx.session = {}
  }

  return ctx as ContextWithSession<T>
}
