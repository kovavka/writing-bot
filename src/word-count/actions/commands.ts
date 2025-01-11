import { allProjectsActionHandler } from './shared'
import { SimpleContext } from '../../shared/bot/context'
import * as db from '../database'
import { texts } from '../copy/texts'
import moment from 'moment-timezone'
import { DATE_FORMAT, TIME_ZONE } from '../../shared/variables'
import { MARATHON_END_STR } from '../variables'
import { getToday } from '../../shared/date'
import { buttons } from '../copy/buttons'
import { BotCommand } from '../../shared/bot/actions'

async function statusHandler(ctx: SimpleContext): Promise<void> {
  const time = getToday().tz(TIME_ZONE).format('HH:mm:ss')

  await ctx.reply(`${texts.status}\nВремя: ${time}`)
}

async function helpHandler(ctx: SimpleContext): Promise<void> {
  await ctx.reply(texts.help, {
    reply_markup: {
      inline_keyboard: [[buttons.newProject, buttons.allProjects]],
    },
  })
}

async function settingsHandler(ctx: SimpleContext): Promise<void> {
  await ctx.reply(texts.settings, {
    reply_markup: {
      inline_keyboard: [[buttons.changeName]],
    },
  })
}

async function adminStatTodayHandler(ctx: SimpleContext): Promise<void> {
  // today by server time
  const today = moment().format(DATE_FORMAT)
  const rows = await db.getTodayStatistics(today)

  const resultByUser: Record<string, { userName: string; wordsDiff: number }> = {}
  rows.forEach(row => {
    const { userId, userName, wordsStart, lastResultWords, todayWords } = row
    const prevWords = lastResultWords != null ? lastResultWords : wordsStart

    const projectResult = {
      userName,
      wordsDiff: todayWords != null ? todayWords - prevWords : 0,
    }

    if (resultByUser[userId] === undefined) {
      resultByUser[userId] = projectResult
    } else {
      const { wordsDiff } = resultByUser[userId]
      resultByUser[userId] = {
        userName: userName,
        wordsDiff: wordsDiff + projectResult.wordsDiff,
      }
    }
  })

  const data = Object.entries(resultByUser).map(([, result]) => {
    const { userName, wordsDiff } = result

    return { userName, wordsDiff }
  })

  const dataSorted = data
    .sort((a, b) => b.wordsDiff - a.wordsDiff)
    .map(x => `${x.userName}: ${x.wordsDiff}`)

  await ctx.reply(dataSorted.join('\n'))
}

async function adminStatHandler(ctx: SimpleContext): Promise<void> {
  const dateFrom = '2024-12-20'

  const rows = await db.getStatistics(dateFrom, MARATHON_END_STR)

  const resultByUser: Record<
    string,
    Array<{ userName: string; projectName: string; wordsStart: number; latestWords: number }>
  > = {}
  rows.forEach(row => {
    const { userId, userName, projectName, wordsStart, latestWords } = row
    if (resultByUser[userId] === undefined) {
      resultByUser[userId] = []
    }

    const userResult = resultByUser[userId]
    userResult.push({
      userName,
      projectName,
      wordsStart,
      latestWords: latestWords != null ? latestWords : wordsStart,
    })
  })

  const data = Object.entries(resultByUser)
    .filter(([, result]) => result.length !== 0)
    .map(([, result]) => {
      const { userName } = result[0]
      const startSum = result.reduce((partialSum, a) => partialSum + a.wordsStart, 0)
      const wordsSum = result.reduce((partialSum, a) => partialSum + a.latestWords, 0)
      const diff = wordsSum - startSum
      const joinedName = result.map(x => x.projectName).join('; ')

      return { userName, joinedName, wordsSum, startSum, diff }
    })
    .map(x => `${x.userName} | ${x.joinedName} | ${x.startSum} | ${x.wordsSum} | ${x.diff}`)

  await ctx.reply(`Имя | Название | Старт | Всего | Разница\n\n${data.join('\n')}`)
}

export const commands: BotCommand[] = [
  {
    command: 'all',
    handler: allProjectsActionHandler,
  },
  {
    command: 'help',
    handler: helpHandler,
  },
  {
    command: 'settings',
    handler: settingsHandler,
  },
  {
    command: 'status',
    handler: statusHandler,
  },
  {
    command: 'stat',
    admin: true,
    handler: adminStatHandler,
  },
  {
    command: 'statToday',
    admin: true,
    handler: adminStatTodayHandler,
  },
]
