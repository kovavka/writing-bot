import {Telegraf, Context} from "telegraf";
import {NarrowedContext} from "telegraf/src/context";
import { Update, Message } from 'telegraf/typings/core/types/typegram';
import Telegram from "telegraf/src/telegram";
// import Context from "telegraf/src/context";

// type Bot = Telegraf<Context>
//
// export type CommandContext = Parameters<Bot['command']>[1]

export interface MessageContext extends Context<Update.MessageUpdate<Message.TextMessage>> {
   session?: {[key: number]: {}}
}

export type QueryContext = NarrowedContext<Context<Update>, Update.CallbackQueryUpdate<any>>


