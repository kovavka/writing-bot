import {
  clearSession,
  getToday,
  initSession,
  isAdmin,
  stringToDate,
} from '../shared/utils'
import { DATE_FORMAT, TIME_ZONE } from '../shared/variables'
import { ContextWithSession, SimpleContext } from '../shared/types'
import { buttons, errors, texts } from '../copy/pero'
import moment from 'moment-timezone'
import { getRemainingDays } from './utils'
import { getChart } from './chart'
import * as db from './database'
import { MARATHON_END_STR } from './variables'
import { TextSessionData } from './chains'
import { MessageType } from './types'

export async function status(ctx: SimpleContext): Promise<void> {
  const time = getToday().tz(TIME_ZONE).format('HH:mm:ss')

  await ctx.reply(`${texts.status}\nВремя: ${time}`)
}

export function startNewChain(
  ctx: ContextWithSession,
  type: MessageType
): void {
  const { id: userId } = ctx.from
  ctx.session[userId] = <TextSessionData>{
    ...(ctx.session[userId] ?? {}),
    type: type,
    stageIndex: 0,
  }
}

export async function start(ctx: SimpleContext): Promise<void> {
  clearSession(ctx)
  const sessionContext = initSession(ctx)

  const { id: userId, first_name, last_name } = ctx.from

  const user = await db.getUser(userId)
  if (user == null) {
    await db.addUser(userId, `${first_name} ${last_name}`)

    startNewChain(sessionContext, 'set_name')
    await ctx.reply(texts.welcome)
  } else {
    await ctx.reply(texts.welcomeBack(user.name), {
      reply_markup: {
        inline_keyboard: [[buttons.allProjects]],
      },
    })
  }
}

export async function projectStatistics(
  ctx: SimpleContext,
  projectId: number
): Promise<void> {
  const [rows, project] = await Promise.all([
    db.getDayResults(projectId),
    db.getProject(projectId),
  ])

  if (project === undefined) {
    return Promise.reject(`Project is undefined, projectId = ${projectId}`)
  }

  const data = []
  const today = getToday()
  const {
    dateStart: dateStartStr,
    dateEnd: dateEndStr,
    wordsStart,
    wordsGoal,
  } = project

  const dateStart = stringToDate(dateStartStr)
  const dateEnd = stringToDate(dateEndStr)
  const projectLength = getRemainingDays(dateStart, dateEnd)
  const remainingDays = getRemainingDays(today, dateEnd)
  const daysPassed = getRemainingDays(dateStart, today)

  rows.forEach(({ date, words }) => {
    const rowDate = stringToDate(date)
    const index = getRemainingDays(dateStart, rowDate) - 1
    data[index] = words
  })

  let prevRes = wordsStart
  // we use daysPassed to render bars until current date
  for (let i = 0; i < daysPassed; i++) {
    if (data[i] !== undefined) {
      prevRes = data[i]
    } else {
      data[i] = prevRes
    }
  }

  const chart = await getChart(
    projectLength,
    data,
    wordsStart,
    wordsGoal + wordsStart
  )

  const wordsLeft = wordsGoal + wordsStart - prevRes
  await ctx.replyWithPhoto(
    { source: chart },
    {
      caption:
        wordsLeft <= 0
          ? texts.statisticsAchieved
          : texts.statistics(remainingDays, wordsLeft),
      reply_markup: {
        inline_keyboard: [[buttons.setToday(projectId)]],
      },
    }
  )

  await ctx.answerCbQuery()
}

export async function allProjects(ctx: SimpleContext): Promise<void> {
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
          { text: row.name, callback_data: `project_${row.id}` },
        ]),
      },
    })
  }
}

export async function adminStatToday(ctx: SimpleContext): Promise<void> {
  if (isAdmin(ctx)) {
    // today by server time
    const today = moment().format(DATE_FORMAT)
    const rows = await db.getTodayStatistics(today)

    const resultByUser = {}
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
  } else {
    await ctx.reply(errors.unknown)
  }
}

export async function adminStat(ctx: SimpleContext): Promise<void> {
  if (isAdmin(ctx)) {
    const dateFrom = '2024-12-20'

    const rows = await db.getStatistics(dateFrom, MARATHON_END_STR)

    const resultByUser = {}
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
      .map(([, result]) => {
        if (result.length === 0) {
          return ''
        }

        const { userName } = result[0]
        const startSum = result.reduce(
          (partialSum, a) => partialSum + a.wordsStart,
          0
        )
        const wordsSum = result.reduce(
          (partialSum, a) => partialSum + a.latestWords,
          0
        )
        const diff = wordsSum - startSum
        const joinedName = result.map(x => x.projectName).join('; ')

        return { userName, joinedName, wordsSum, startSum, diff }
      })
      .map(
        x =>
          `${x.userName} | ${x.joinedName} | ${x.startSum} | ${x.wordsSum} | ${x.diff}`
      )

    await ctx.reply(
      `Имя | Название | Старт | Всего | Разница\n\n${data.join('\n')}`
    )
  } else {
    await ctx.reply(errors.unknown)
  }
}
