import {Moment} from "moment-timezone";

export function getRemainingDays(dateFrom: Moment, dateTo: Moment) {
    // including both
    return dateTo.startOf('day').diff(dateFrom.startOf('day'), 'days') + 1
}