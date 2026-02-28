import { ContextWithSession } from '../../shared/bot/context'
import { texts } from '../copy/texts'
import * as db from '../database'
import { DEFAULT_PROJECT_NAME, MARATHON_END_DATE, MARATHON_WORD_GOAL } from '../variables'
import { PeroTextChainType } from '../types'
import { buttons } from '../copy/buttons'
import { getToday, getTodayString, stringToDate } from '../../shared/date'
import { BotTextChainAction, TextChainSessionData } from '../../shared/bot/actions'
import { getRemainingDays } from './shared'
import { DATE_FORMAT } from '../../shared/variables'
import { Moment } from 'moment-timezone'

type BaseSessionData = TextChainSessionData<PeroTextChainType>

export type NewProjectChainData = BaseSessionData & {
  projectName?: string
  wordsStart?: number
  deadline?: Moment
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
  sessionData.projectName = userInput
  await ctx.reply(texts.setStart)
}

async function wordsStartHandler(
  ctx: ContextWithSession,
  wordsStart: number,
  sessionData: NewProjectChainData
): Promise<void> {
  sessionData.wordsStart = wordsStart
  await ctx.reply(texts.setDeadline, { parse_mode: 'Markdown' })
}

async function marathonWordsStartHandler(
  ctx: ContextWithSession,
  wordsStart: number,
  sessionData: NewProjectChainData
): Promise<void> {
  const { projectName = DEFAULT_PROJECT_NAME } = sessionData

  await createNewProject(
    ctx,
    projectName,
    wordsStart,
    MARATHON_WORD_GOAL,
    MARATHON_END_DATE,
    true
  )
}

async function projectDeadlineHandler(
  ctx: ContextWithSession,
  deadline: Moment,
  sessionData: NewProjectChainData
): Promise<void> {
  sessionData.deadline = deadline
  await ctx.reply(texts.setGoal)
}

async function createNewProject(
  ctx: ContextWithSession,
  projectName: string,
  wordsStart: number,
  wordsGoal: number,
  dateEnd: Moment,
  isMarathon: boolean = false
): Promise<void> {
  const { id: userId } = ctx.from

  const today = getToday()
  const dateEndStr = dateEnd.format(DATE_FORMAT)

  const remainingDays = getRemainingDays(today, dateEnd)

  const projectId = await db.createProject(
    userId,
    projectName,
    getTodayString(),
    dateEndStr,
    wordsStart,
    wordsGoal,
    isMarathon ? 1 : 0
  )

  const dailyGoal = Math.ceil(wordsGoal / remainingDays)
  await ctx.reply(texts.projectCreated(wordsStart + wordsGoal, remainingDays, dailyGoal), {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[buttons.setToday(projectId), buttons.statistics(projectId)]],
    },
  })
}

async function wordsGoalHandler(
  ctx: ContextWithSession,
  wordsGoal: number,
  sessionData: NewProjectChainData
): Promise<void> {
  const { projectName = DEFAULT_PROJECT_NAME, wordsStart = 0, deadline } = sessionData

  const dateEnd = deadline !== undefined ? deadline : getToday().endOf('month')

  await createNewProject(ctx, projectName, wordsStart, wordsGoal, dateEnd)
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

  const project = await db.getProject(projectId)
  if (project === undefined) {
    return Promise.reject(`Project is undefined, projectId = ${projectId}`)
  }

  await db.updateProjectGoal(projectId, goal)

  const today = getToday()
  const dateEnd = stringToDate(project.dateEnd)

  const remainingDays = getRemainingDays(today, dateEnd)

  const wordsFinal = project.wordsStart + goal
  if (remainingDays <= 0) {
    await ctx.reply(texts.goalUpdatedAfterDeadline(wordsFinal), {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[buttons.statistics(projectId)]],
      },
    })

    return
  }

  const todayStr = getTodayString()
  const prevDayResult = await db.getPrevDayResult(projectId, todayStr)
  const remainingWords =
    prevDayResult !== undefined ? goal + project.wordsStart - prevDayResult.words : goal
  const dailyGoal = Math.ceil(remainingWords / remainingDays)

  if (remainingWords <= 0) {
    await ctx.reply(texts.goalUpdatedAchieved, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[buttons.statistics(projectId)]],
      },
    })
  } else {
    await ctx.reply(texts.goalUpdated(wordsFinal, remainingDays, dailyGoal), {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[buttons.setToday(projectId), buttons.statistics(projectId)]],
      },
    })
  }
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
        inputType: 'string',
        handler: projectNameHandler,
      },
      {
        inputType: 'number',
        handler: wordsStartHandler,
      },
      {
        inputType: 'date',
        handler: projectDeadlineHandler,
      },
      {
        inputType: 'number',
        handler: wordsGoalHandler,
      },
    ],
  },
  {
    type: PeroTextChainType.NewMarathonProject,
    stages: [
      {
        inputType: 'string',
        handler: projectNameHandler,
      },
      {
        inputType: 'number',
        handler: marathonWordsStartHandler,
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
