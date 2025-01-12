import { SimpleContext } from '../../shared/bot/context'
import { texts } from '../copy/texts'
import * as db from '../database'
import { buttons } from '../copy/buttons'
import { PeroQueryActionType } from '../types'
import { Moment } from 'moment-timezone'

export async function allProjectsActionHandler(ctx: SimpleContext): Promise<void> {
  const { id: userId } = ctx.from

  const rows = await db.getProjects(userId)
  if (rows.length === 0) {
    await ctx.reply(texts.zeroProjects, {
      reply_markup: {
        inline_keyboard: [[buttons.newProject]],
      },
    })
  } else {
    await ctx.reply(texts.allProjects, {
      reply_markup: {
        inline_keyboard: rows.map(row => [
          {
            text: row.name,
            callback_data: `${PeroQueryActionType.Project}_${row.id}`,
          },
        ]),
      },
    })
  }
}

export function getRemainingDays(dateFrom: Moment, dateTo: Moment): number {
  // including both
  return dateTo.startOf('day').diff(dateFrom.startOf('day'), 'days') + 1
}
