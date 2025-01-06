import moment, {Moment} from "moment-timezone";
import {TIME_ZONE, DATE_FORMAT, ADMIN_ID} from "./variables"
import {MessageContext, QueryContext} from "./types";

export function isAdmin(ctx: MessageContext) {
    const {id: userId} = ctx.from
    const ifAdmin = userId.toString() === ADMIN_ID

    // todo
    // if (!ifAdmin) {
    //     ctx.reply(errors.unknown);
    // }

    return ifAdmin
}

export function initSession(ctx: QueryContext): void {
    if (ctx.session == null) {
        ctx.session = {};
    }
}

export function clearSession(ctx: QueryContext): void {
    const {id: userId} = ctx.from

    if (ctx.session != null) {
        ctx.session[userId] = {}
    }
}

export function getToday(): Moment {
    const date = moment();
    return date.tz(TIME_ZONE);
}

export function dateToString(date = getToday()): string {
    return date.tz(TIME_ZONE).format(DATE_FORMAT);
}

export function getTodayString(): string {
    return dateToString(moment())
}
