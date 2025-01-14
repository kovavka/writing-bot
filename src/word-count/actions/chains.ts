import { ContextWithSession } from '../../shared/bot/context'
import { texts } from '../copy/texts'
import * as db from '../database'
import { DEFAULT_PROJECT_NAME, MARATHON_END_DATE } from '../variables'
import { PeroTextChainType } from '../types'
import { buttons } from '../copy/buttons'
import { dateToString, getToday, getTodayString } from '../../shared/date'
import { BotTextChainAction, TextChainSessionData } from '../../shared/bot/actions'
import { getRemainingDays } from './shared'

type BaseSessionData = TextChainSessionData<PeroTextChainType>

export type NewProjectChainData = BaseSessionData & {
  projectName?: string
}

export type ProjectData = BaseSessionData & {
  projectId?: number
}

export type AnySessionData = NewProjectChainData | ProjectData | BaseSessionData

async function projectNameHandler(
  ctx: ContextWithSession,
  userInput: string,
  sessionData: NewProjectChainData
): Promise<void> {
  await ctx.reply(texts.setStart)
  sessionData.projectName = userInput
}

async function createProjectCommand(
  ctx: ContextWithSession,
  projectName: string,
  wordsStart: number,
  goal: number
): Promise<void> {
  const { id: userId } = ctx.from

  const today = getToday()
  const dateEnd = MARATHON_END_DATE

  const remainingDays = getRemainingDays(today, dateEnd)

  const projectId = await db.createProject(
    userId,
    projectName,
    getTodayString(),
    dateToString(dateEnd),
    wordsStart,
    goal
  )

  const dailyGoal = Math.ceil(goal / remainingDays)
  await ctx.reply(texts.projectCreated(wordsStart + goal, remainingDays, dailyGoal), {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[buttons.setToday(projectId), buttons.statistics(projectId)]],
    },
  })
}

async function wordsStartHandler(
  ctx: ContextWithSession,
  words: number,
  sessionData: NewProjectChainData
): Promise<void> {
  const { projectName = DEFAULT_PROJECT_NAME } = sessionData
  //todo remove after enabling custom goal
  await createProjectCommand(ctx, projectName, words, 50000)
}

async function editProjectGoalHandler(
  ctx: ContextWithSession,
  goal: number,
  sessionData: ProjectData
): Promise<void> {
  const { projectId } = sessionData
  if (projectId === undefined) {
    return Promise.reject('ProjectId is undefined')
  }

  await db.updateProjectGoal(projectId, goal)

  const today = getToday()
  const dateEnd = MARATHON_END_DATE

  const remainingDays = getRemainingDays(today, dateEnd)

  const project = await db.getProject(projectId)
  if (project === undefined) {
    return Promise.reject(`Project is undefined, projectId = ${projectId}`)
  }

  const dailyGoal = Math.ceil(goal / remainingDays)

  await ctx.reply(texts.goalUpdated(project.wordsStart + goal, remainingDays, dailyGoal), {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[buttons.setToday(projectId), buttons.statistics(projectId)]],
    },
  })
}

async function renameProjectHandler(
  ctx: ContextWithSession,
  projectName: string,
  sessionData: ProjectData
): Promise<void> {
  const { projectId } = sessionData
  if (projectId === undefined) {
    return Promise.reject('ProjectId is undefined')
  }

  await db.renameProject(projectId, projectName)
  await ctx.reply(texts.projectRenamed, {
    reply_markup: {
      inline_keyboard: [
        [buttons.editProject(projectId)],
        [buttons.setToday(projectId), buttons.statistics(projectId)],
      ],
    },
  })
}

async function currentWordsHandler(
  ctx: ContextWithSession,
  currentWords: number,
  sessionData: ProjectData
): Promise<void> {
  const { projectId } = sessionData
  if (projectId === undefined) {
    return Promise.reject('ProjectId is undefined')
  }

  const todayStr = getTodayString()
  const [project, result] = await Promise.all([
    db.getProject(projectId),
    db.getPrevDayResult(projectId, todayStr),
  ])

  if (project === undefined) {
    return Promise.reject(`Project is undefined, projectId = ${projectId}`)
  }

  const prevWords = result != null ? result.words : project.wordsStart
  const wordsDiff = currentWords - prevWords

  await db.setResult(projectId, currentWords, todayStr)

  const goalAchieved = currentWords >= project.wordsStart + project.wordsGoal
  await ctx.reply(
    goalAchieved
      ? texts.todayAchieved
      : wordsDiff >= 0
        ? texts.todaySaved(wordsDiff)
        : texts.todaySavedNegative(wordsDiff),
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[buttons.setToday(projectId), buttons.statistics(projectId)]],
      },
    }
  )
}

async function updateUserName(
  ctx: ContextWithSession,
  userName: string,
  message: string
): Promise<void> {
  const { id: userId } = ctx.from
  await db.updateUser(userId, userName)

  await ctx.reply(message, {
    reply_markup: {
      inline_keyboard: [[buttons.newProject, buttons.allProjects]],
    },
  })
}

async function setUserNameHandler(ctx: ContextWithSession, userName: string): Promise<void> {
  await updateUserName(ctx, userName, texts.userNameSet)
}

async function changeUserNameHandler(ctx: ContextWithSession, userName: string): Promise<void> {
  await updateUserName(ctx, userName, texts.userNameUpdated)
}

export const textInputCommands: BotTextChainAction<PeroTextChainType, AnySessionData>[] = [
  {
    type: PeroTextChainType.NewProject,
    stages: [
      {
        // project name
        inputType: 'string',
        handler: projectNameHandler,
      },
      {
        // words start
        inputType: 'number',
        handler: wordsStartHandler,
      },
    ],
  },
  {
    type: PeroTextChainType.EditGoal,
    stages: [
      {
        inputType: 'number',
        handler: editProjectGoalHandler,
      },
    ],
  },
  {
    type: PeroTextChainType.RenameProject,
    stages: [
      {
        inputType: 'string',
        handler: renameProjectHandler,
      },
    ],
  },
  {
    type: PeroTextChainType.UpdateWords,
    stages: [
      {
        inputType: 'number',
        handler: currentWordsHandler,
      },
    ],
  },
  {
    type: PeroTextChainType.SetName,
    stages: [
      {
        inputType: 'string',
        handler: setUserNameHandler,
      },
    ],
  },
  {
    type: PeroTextChainType.ChangeName,
    stages: [
      {
        inputType: 'string',
        handler: changeUserNameHandler,
      },
    ],
  },
]
