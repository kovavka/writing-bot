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

type SessionContext = {
   session?: {[key: number]: {}}
}

export type MessageContext = Context<Update.MessageUpdate<Message.TextMessage>> & SessionContext
// export type MessageContext = Context<Update.MessageUpdate<Message.TextMessage>> & SessionContext

// export type QueryContext = NarrowedContext<Context<Update>, Update.CallbackQueryUpdate<CallbackQuery>>

type AllowedProps = 'from' | 'reply' | 'session' | 'answerCbQuery' | 'replyWithPhoto'
export type SimpleContext  = Pick<MessageContext, AllowedProps>