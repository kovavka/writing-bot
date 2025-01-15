import { Context, NarrowedContext } from 'telegraf'
import { Update, Message, CallbackQuery } from 'telegraf/typings/core/types/typegram'

type SessionData = {
  session?: { [key: number]: object }
}

type AllowedProps = 'from' | 'reply' | 'answerCbQuery' | 'replyWithPhoto'
export type SimpleContext = Pick<
  Context<Update.MessageUpdate<Message.TextMessage>>,
  AllowedProps
> &
  SessionData

export type CommandMessageContext = Context<{
  message: Update.New & Update.NonChannel & Message.TextMessage
  update_id: number
}>

export type CallbackQueryContext = NarrowedContext<
  Context<Update>,
  Update.CallbackQueryUpdate<CallbackQuery>
>
export type TextMessageContext = NarrowedContext<
  Context<Update>,
  { message: Update.New & Update.NonChannel & Message.TextMessage; update_id: number }
>

export type ContextWithSession<T = SimpleContext> = T & Required<SessionData>
