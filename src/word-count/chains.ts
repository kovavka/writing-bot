import {ContextWithSession, TextMessageContext} from "../shared/types";
import {buttons, texts} from "../copy/pero";
import {dateToString, getToday, getTodayString} from "../shared/utils";
import {getRemainingDays} from "./utils";
import * as db from './database'
import {DEFAULT_PROJECT_NAME, MARATHON_END_DATE} from "./variables";

export type MessageType =
    | 'new_project'
    | 'rename_project'
    | 'update_words'
    | 'set_name'
    | 'change_name'

export type TextSessionData = {
    type: MessageType
    stageIndex: number
}

export type NewProjectData = TextSessionData & {
    projectName?: string
    wordsStart?: string
}

export type SimpleProjectData = TextSessionData & {
    projectId?: number
}

type ChainStage<T> =
    | {
        inputType: 'number',
        handler: (ctx: ContextWithSession<TextMessageContext>, userInput: number, sessionData: T) => Promise<void>
      }
    | {
        inputType: 'string',
        handler: (ctx: ContextWithSession<TextMessageContext>, userInput: string, sessionData: T) => Promise<void>
      }

export type TextChainCommand<T> = {
    type: MessageType,
    stages: ChainStage<T>[]
}

async function projectNameHandler(ctx: ContextWithSession, userInput: string, sessionData: NewProjectData): Promise<void> {
    await ctx.reply(texts.setStart);
    sessionData.projectName = userInput
}

async function createProjectCommand(ctx: ContextWithSession, projectName: string, wordsStart: number, goal: number): Promise<void> {
    const {id: userId} = ctx.from

    const today = getToday()
    const dateEnd = MARATHON_END_DATE

    const remainingDays = getRemainingDays(today, dateEnd)

    const projectId = await db.createProject(userId, projectName, getTodayString(), dateToString(dateEnd), wordsStart, goal)

    const dailyGoal = Math.ceil(goal / remainingDays)
    await ctx.reply(texts.projectCreated(wordsStart + goal, remainingDays, dailyGoal),
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        buttons.setToday(projectId),
                        buttons.statistics(projectId),
                    ],
                ],
            },
        });
}


async function wordsStartHandler(ctx: ContextWithSession, words: number, sessionData: NewProjectData): Promise<void> {
    const {projectName = DEFAULT_PROJECT_NAME} = sessionData
    //todo remove after enabling custom goal
    await createProjectCommand(ctx, projectName, words, 50000)
}

async function renameProjectHandler(ctx: ContextWithSession, projectName: string, sessionData: SimpleProjectData): Promise<void> {
    const {projectId} = sessionData
    if (projectId === undefined) {
        return
        // throw error?
    }

    await db.renameProject(projectId, projectName)
    await ctx.reply(texts.projectRenamed, {
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

async function currentWordsHandler(ctx: ContextWithSession, currentWords: number, sessionData: SimpleProjectData): Promise<void> {
    const {projectId} = sessionData
    if (projectId === undefined) {
        return
        // throw error?
    }

    const todayStr = getTodayString()
    const [project, result] = await Promise.all([db.getProject(projectId), db.getPrevDayResult(projectId, todayStr)])

    const prevWords = result != null ? result.words : project.wordsStart
    const wordsDiff = currentWords - prevWords

    await db.setResult(projectId, currentWords, todayStr)

    const goalAchieved = currentWords >= project.wordsStart + project.wordsGoal
    await ctx.reply(goalAchieved ? texts.todayAchieved : wordsDiff >= 0 ? texts.todaySaved(wordsDiff) : texts.todaySavedNegative(wordsDiff), {
        reply_markup: {
            inline_keyboard: [
                [
                    buttons.setToday(projectId),
                    buttons.statistics(projectId),
                ],
            ],
        },
    });

}

async function updateUserName(ctx: ContextWithSession, userName: string, message: string): Promise<void> {
    const {id: userId} = ctx.from
    // todo add await
    db.updateUser(userId, userName)

    await ctx.reply(message, {
        reply_markup: {
            inline_keyboard: [
                [
                    buttons.newProject,
                    buttons.allProjects
                ]
            ]
        },
    });
}

async function setUserNameHandler(ctx: ContextWithSession, userName: string): Promise<void> {
    await updateUserName(ctx, userName, texts.userNameSet)
}

async function changeUserNameHandler(ctx: ContextWithSession, userName: string): Promise<void> {
    await updateUserName(ctx, userName, texts.userNameUpdated)
}

export type AnySessionData = NewProjectData | SimpleProjectData | TextSessionData

export const textInputCommands: TextChainCommand<AnySessionData>[] = [
    {
        type: 'new_project',
        stages: [
            {
                // project name
                inputType: 'string',
                handler: projectNameHandler
            },
            {
                // words start
                inputType: 'number',
                handler: wordsStartHandler
            },
        ]
    },
    {
        type: 'rename_project',
        stages: [
            {
                inputType: "string",
                handler: renameProjectHandler
            }
        ]
    },
    {
        type: 'update_words',
        stages: [
            {
                inputType: "number",
                handler: currentWordsHandler
            }
        ]
    },
    {
        type: 'set_name',
        stages: [
            {
                inputType: "string",
                handler: setUserNameHandler
            }
        ]
    },
    {
        type: 'change_name',
        stages: [
            {
                inputType: "string",
                handler: changeUserNameHandler
            }
        ]
    },
]