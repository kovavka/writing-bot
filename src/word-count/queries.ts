import {ContextWithSession} from "../shared/types";
import {buttons, texts} from "../copy/pero";
import * as commands from "./commands";
import {MessageType, SimpleProjectData, TextSessionData} from "./text-commands";
import db from './database'
import {getTodayString} from "../shared/utils";

export type QueryType =
    | 'new_project'
    | 'project'
    | 'edit_project'
    | 'rename_project'
    | 'remove_project'
    | 'update_project'
    | 'stat_project'
    | 'all_projects'
    | 'change_name'

type QueryCommand = {
    type: QueryType
    handler: (ctx: ContextWithSession, ...params: string[]) => Promise<void>
    chainCommand?: MessageType
}

function saveProjectId(ctx: ContextWithSession, projectId: number) {
    const {id: userId} = ctx.from
    ctx.session[userId] = <Omit<SimpleProjectData, keyof TextSessionData>>{
        projectId
    };
}

async function updateProjectHandler(ctx: ContextWithSession, projectIdStr: string): Promise<void> {
    const projectId = Number(projectIdStr)
    saveProjectId(ctx, projectId)

    const row = await db.getCurrentWords(projectId)
    const prevWords = row.latestWords ?? row.wordsStart

    await ctx.reply(texts.setToday(prevWords));
}

async function getProjectHandler(ctx: ContextWithSession, projectIdStr: string): Promise<void> {
    const projectId = Number(projectIdStr)
    const project = await db.getProject(projectId)
    await ctx.reply(texts.selectProject(project.name),
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        buttons.editProject(projectId)
                    ],
                    [
                        buttons.setToday(projectId),
                        buttons.statistics(projectId),
                    ],
                ],
            },
        });
}

async function editProjectHandler(ctx: ContextWithSession, projectIdStr: string): Promise<void> {
    const projectId = Number(projectIdStr)
    await ctx.reply(texts.editProject,
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        buttons.renameProject(projectId),
                        buttons.removeProject(projectId),
                    ],
                ],
            },
        });
}

async function renameProjectHandler(ctx: ContextWithSession, projectIdStr: string): Promise<void> {
    const projectId = Number(projectIdStr)
    saveProjectId(ctx, projectId)

    await ctx.reply(texts.setName);
}

async function removeProjectHandler(ctx: ContextWithSession, projectIdStr: string): Promise<void> {
    const projectId = Number(projectIdStr)
    const today = getTodayString()
    await db.hideProject(projectId, today)
    await ctx.reply(texts.projectRemoved,
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        buttons.allProjects,
                        buttons.newProject,
                    ],
                ],
            },
        });
}

async function projectStatHandler(ctx: ContextWithSession, projectIdStr: string): Promise<void> {
    const projectId = Number(projectIdStr)
    await commands.projectStatistics(ctx, projectId)
}

export const queryMap: QueryCommand[] = [
    {
        type: 'new_project',
        handler: async (ctx: ContextWithSession) => { await ctx.reply(texts.setName) },
        chainCommand: 'new_project'
    },
    {
        type: 'project',
        handler: getProjectHandler,
    },
    {
        type: 'edit_project',
        handler: editProjectHandler,
    },
    {
        type: 'rename_project',
        handler: renameProjectHandler,
        chainCommand: 'rename_project'
    },
    {
        type: 'remove_project',
        handler: removeProjectHandler,
    },
    {
        type: 'update_project',
        handler: updateProjectHandler,
        chainCommand: 'update_words'
    },
    {
        type: 'stat_project',
        handler: projectStatHandler,
    },
    {
        type: 'all_projects',
        handler: commands.allProjects,
    },
    {
        type: 'change_name',
        handler: async (ctx: ContextWithSession) => { await ctx.reply(texts.changeName) },
        chainCommand: 'change_name'
    },
]
