import {Telegraf, Context, NarrowedContext} from "telegraf";
// import {NarrowedContext} from "telegraf/src/context";
import { Update, Message } from 'telegraf/typings/core/types/typegram';
// import { CallbackQuery } from 'telegraf/types';
import Telegram from "telegraf/src/telegram";
import {CallbackQuery} from "@telegraf/types/markup";
// import Context from "telegraf/src/context";

// type Bot = Telegraf<Context>
//
// export type CommandContext = Parameters<Bot['command']>[1]

type SessionData = {
   session?: {[key: number]: {}}
}

type MessageContext = Context<Update.MessageUpdate<Message.TextMessage>>

type AllowedProps = 'from' | 'reply' | 'answerCbQuery' | 'replyWithPhoto'
export type SimpleContext  = Pick<MessageContext, AllowedProps> & SessionData

export type TextMessageContext  = SimpleContext & Pick<MessageContext, 'message'>

export type ContextWithSession<T = SimpleContext> = T & Required<SessionData>
