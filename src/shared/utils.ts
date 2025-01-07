import moment, {Moment} from "moment-timezone";
import {TIME_ZONE, DATE_FORMAT, ADMIN_ID} from "./variables"
import {SessionContext, SimpleContext} from "./types";

export function isAdmin(ctx: SimpleContext): boolean {
    const {id: userId} = ctx.from
    return userId.toString() === ADMIN_ID
}

export function initSession(ctx: SimpleContext): SessionContext {
    if (ctx.session == null) {
        ctx.session = {};
    }

    return ctx as SessionContext
}

export function clearSession(ctx: SimpleContext): void {
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
