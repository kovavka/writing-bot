import { Moment } from 'moment-timezone'
import { EventStatus } from './types'
import { User } from './database/types'
import * as db from './database'
import { ADMIN_ID } from '../shared/variables'
import { Context, Telegraf } from 'telegraf'
import { Update } from 'telegraf/typings/core/types/typegram'

export type SprintData = {
  id: number
  startMoment: Moment
  endMoment: Moment
  results: {
    [key: number]:
      | {
          finalWords: number
          startWords: number
          diff: number
        }
      | undefined
  }
  breakDuration: number
}

export type EventDataType = {
  eventId: number
  eventStatus: EventStatus

  /**
   * When on break, this will be the next sprint
   */
  sprintIndex: number

  sprintsNumber: number
  isBreak?: boolean

  sprints: SprintData[]

  participants: {
    [key: number]:
      | {
          startWords: number
          active: boolean
        }
      | undefined
  }
}

export class GlobalSession {
  eventData: EventDataType | undefined
  users: User[]
  private bot: Telegraf<Context<Update>>

  static _instance: GlobalSession | undefined

  private constructor(
    bot: Telegraf<Context<Update>>,
    users: User[],
    eventData: EventDataType | undefined
  ) {
    this.bot = bot
    this.users = users
    this.eventData = eventData
  }

  static init(
    bot: Telegraf<Context<Update>>,
    users: User[],
    eventData: EventDataType | undefined
  ): void {
    this._instance = new GlobalSession(bot, users, eventData)
  }

  static get instance(): GlobalSession {
    if (this._instance === undefined) {
      throw Error('instance is undefined. Forgot init?')
    }
    return this._instance
  }

  sendToAdmin(message: string): void {
    this.bot.telegram.sendMessage(ADMIN_ID, message)
  }

  sendError(err: unknown): void {
    this.sendToAdmin(`Something went wrong. ${err}`)
  }

  addUser(id: number, name: string): void {
    this.users.push({
      id,
      name,
    })

    db.addUser(id, name).catch(this.sendError.bind(this))
  }
}
