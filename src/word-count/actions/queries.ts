import { ContextWithSession } from '../../shared/bot/context'
import { texts } from '../copy/texts'
import { ProjectData } from './chains'
import * as db from '../database'
import { PeroTextChainType, PeroQueryActionType } from '../types'
import { buttons } from '../copy/buttons'
import { allProjectsActionHandler, getRemainingDays } from './shared'
import { getChart } from './chart'
import { getToday, getTodayString, stringToDate } from '../../shared/date'
import { BotQueryAction, TextChainSessionData } from '../../shared/bot/actions'

function saveProjectId(ctx: ContextWithSession, projectId: number): void {
  const { id: userId } = ctx.from
  ctx.session[userId] = <Omit<ProjectData, keyof TextChainSessionData<PeroTextChainType>>>{
    projectId,
  }
}

async function updateProjectHandler(
  ctx: ContextWithSession,
  projectIdStr: string
): Promise<void> {
  const projectId = Number(projectIdStr)
  saveProjectId(ctx, projectId)

  const row = await db.getCurrentWords(projectId)
  if (row === undefined) {
    return Promise.reject(`Couldn't find latest words, projectId = ${projectId}`)
  }
  const prevWords = row.latestWords ?? row.wordsStart

  await ctx.reply(texts.setToday(prevWords))
}

async function getProjectHandler(ctx: ContextWithSession, projectIdStr: string): Promise<void> {
  const projectId = Number(projectIdStr)
  const project = await db.getProject(projectId)
  if (project === undefined) {
    return Promise.reject(`Project is undefined, projectId = ${projectId}`)
  }

  await ctx.reply(texts.selectProject(project.name), {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [buttons.editProject(projectId)],
        [buttons.setToday(projectId), buttons.statistics(projectId)],
      ],
    },
  })
}

async function editProjectHandler(
  ctx: ContextWithSession,
  projectIdStr: string
): Promise<void> {
  const projectId = Number(projectIdStr)
  await ctx.reply(texts.editProject, {
    reply_markup: {
      inline_keyboard: [
        [buttons.editGoal(projectId)],
        [buttons.renameProject(projectId), buttons.removeProject(projectId)],
      ],
    },
  })
}

async function editProjectGoalHandler(
  ctx: ContextWithSession,
  projectIdStr: string
): Promise<void> {
  const projectId = Number(projectIdStr)
  saveProjectId(ctx, projectId)
  await ctx.reply(texts.editGoal)
}

async function renameProjectHandler(
  ctx: ContextWithSession,
  projectIdStr: string
): Promise<void> {
  const projectId = Number(projectIdStr)
  saveProjectId(ctx, projectId)

  await ctx.reply(texts.setName)
}

async function removeProjectHandler(
  ctx: ContextWithSession,
  projectIdStr: string
): Promise<void> {
  const projectId = Number(projectIdStr)
  const today = getTodayString()
  await db.hideProject(projectId, today)
  await ctx.reply(texts.projectRemoved, {
    reply_markup: {
      inline_keyboard: [[buttons.allProjects, buttons.newProject]],
    },
  })
}

async function projectStatHandler(
  ctx: ContextWithSession,
  projectIdStr: string
): Promise<void> {
  const projectId = Number(projectIdStr)

  const [rows, project] = await Promise.all([
    db.getDayResults(projectId),
    db.getProject(projectId),
  ])

  if (project === undefined) {
    return Promise.reject(`Project is undefined, projectId = ${projectId}`)
  }

  const data = []
  const today = getToday()
  const { dateStart: dateStartStr, dateEnd: dateEndStr, wordsStart, wordsGoal } = project

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

  let prevDayWords = wordsStart

  let savedResult = wordsStart
  // we use daysPassed to fill the bars until current date
  for (let i = 0; i < daysPassed; i++) {
    if (i === daysPassed - 1) {
      prevDayWords = savedResult
    }

    if (data[i] !== undefined) {
      savedResult = data[i]
    } else {
      data[i] = savedResult
    }
  }

  const currentWords = savedResult

  const chart = await getChart(projectLength, data, wordsStart, wordsGoal + wordsStart)

  // in this case 0 means the next day after deadline
  if (remainingDays <= 0) {
    const goalPercent = Math.floor(((currentWords - wordsStart) / wordsGoal) * 100)
    await ctx.replyWithPhoto(
      { source: chart },
      {
        caption: texts.statisticsAfterDeadline(goalPercent),
        reply_markup: {
          inline_keyboard: [[buttons.newProject]],
        },
      }
    )
  } else {
    const wordsLeft = wordsGoal + wordsStart - currentWords
    const wordsLeftPrev = wordsGoal + wordsStart - prevDayWords

    const dailyGoal = Math.ceil(wordsLeftPrev / remainingDays)
    await ctx.replyWithPhoto(
      { source: chart },
      {
        caption:
          wordsLeft <= 0
            ? texts.statisticsAchieved
            : texts.statistics(remainingDays, wordsLeft, dailyGoal),
        reply_markup: {
          inline_keyboard: [[buttons.setToday(projectId)]],
        },
      }
    )
  }

  await ctx.answerCbQuery()
}

export const queryMap: BotQueryAction<PeroQueryActionType, PeroTextChainType>[] = [
  {
    type: PeroQueryActionType.NewProject,
    handler: async (ctx: ContextWithSession): Promise<void> => {
      await ctx.reply(texts.setName)
    },
    chainCommand: PeroTextChainType.NewProject,
  },
  {
    type: PeroQueryActionType.Project,
    handler: getProjectHandler,
  },
  {
    type: PeroQueryActionType.EditProject,
    handler: editProjectHandler,
  },
  {
    type: PeroQueryActionType.EditGoal,
    handler: editProjectGoalHandler,
    chainCommand: PeroTextChainType.EditGoal,
  },
  {
    type: PeroQueryActionType.RenameProject,
    handler: renameProjectHandler,
    chainCommand: PeroTextChainType.RenameProject,
  },
  {
    type: PeroQueryActionType.RemoveProject,
    handler: removeProjectHandler,
  },
  {
    type: PeroQueryActionType.UpdateProject,
    handler: updateProjectHandler,
    chainCommand: PeroTextChainType.UpdateWords,
  },
  {
    type: PeroQueryActionType.StatProject,
    handler: projectStatHandler,
  },
  {
    type: PeroQueryActionType.AllProjects,
    handler: allProjectsActionHandler,
  },
  {
    type: PeroQueryActionType.ChangeName,
    handler: async (ctx: ContextWithSession): Promise<void> => {
      await ctx.reply(texts.changeName)
    },
    chainCommand: PeroTextChainType.ChangeName,
  },
]
