import { Context } from 'telegraf'
import { Update, Message } from 'telegraf/typings/core/types/typegram'

type SessionData = {
  session?: { [key: number]: object }
}

type MessageContext = Context<Update.MessageUpdate<Message.TextMessage>>

type AllowedProps = 'from' | 'reply' | 'answerCbQuery' | 'replyWithPhoto'
export type SimpleContext = Pick<MessageContext, AllowedProps> & SessionData

export type TextMessageContext = SimpleContext & Pick<MessageContext, 'message'>

export type ContextWithSession<T = SimpleContext> = T & Required<SessionData>
