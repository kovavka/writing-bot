import {MiddlewareFn, Context} from "telegraf";
import {getToday} from "../shared/utils";
import {TIME_ZONE} from "../shared/variables";
import {MessageContext} from "../shared/types";
import {texts} from "../copy/pero";

export function status(ctx: MessageContext): void {
    const time = getToday().tz(TIME_ZONE).format('HH:mm:ss')

    ctx.reply(`${texts.status}\nВремя: ${time}`)
}


export function temp(ctx: MessageContext): void {

}