import { ContextWithSession } from '../../shared/types'
import { texts } from '../copy/texts'
import * as commands from './commands'
import { SimpleProjectData, TextSessionData } from './chains'
import * as db from '../database'
import { getTodayString } from '../../shared/utils'
import { MessageType, QueryType } from '../types'
import { buttons } from '../copy/buttons'

type QueryCommand = {
  type: QueryType
  handler: (ctx: ContextWithSession, ...params: string[]) => Promise<void>
  chainCommand?: MessageType
}

function saveProjectId(ctx: ContextWithSession, projectId: number): void {
  const { id: userId } = ctx.from
  ctx.session[userId] = <Omit<SimpleProjectData, keyof TextSessionData>>{
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
    return Promise.reject(
      `Couldn't find latest words, projectId = ${projectId}`
    )
  }
  const prevWords = row.latestWords ?? row.wordsStart

  await ctx.reply(texts.setToday(prevWords))
}

async function getProjectHandler(
  ctx: ContextWithSession,
  projectIdStr: string
): Promise<void> {
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
  await commands.projectStatistics(ctx, projectId)
}

export const queryMap: QueryCommand[] = [
  {
    type: QueryType.NewProject,
    handler: async (ctx: ContextWithSession): Promise<void> => {
      await ctx.reply(texts.setName)
    },
    chainCommand: MessageType.NewProject,
  },
  {
    type: QueryType.Project,
    handler: getProjectHandler,
  },
  {
    type: QueryType.EditProject,
    handler: editProjectHandler,
  },
  {
    type: QueryType.EditGoal,
    handler: editProjectGoalHandler,
    chainCommand: MessageType.EditGoal,
  },
  {
    type: QueryType.RenameProject,
    handler: renameProjectHandler,
    chainCommand: MessageType.RenameProject,
  },
  {
    type: QueryType.RemoveProject,
    handler: removeProjectHandler,
  },
  {
    type: QueryType.UpdateProject,
    handler: updateProjectHandler,
    chainCommand: MessageType.UpdateWords,
  },
  {
    type: QueryType.StatProject,
    handler: projectStatHandler,
  },
  {
    type: QueryType.AllProjects,
    handler: commands.allProjects,
  },
  {
    type: QueryType.ChangeName,
    handler: async (ctx: ContextWithSession): Promise<void> => {
      await ctx.reply(texts.changeName)
    },
    chainCommand: MessageType.ChangeName,
  },
]
