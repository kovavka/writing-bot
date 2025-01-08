import {ContextWithSession, SimpleContext, TextMessageContext} from "../shared/types";
import {buttons, errors, texts} from "../copy/pero";
import * as commands from "./commands";
import {dateToString, getToday, getTodayString} from "../shared/utils";
import {getRemainingDays} from "./utils";
import db from './database'
import {MARATHON_END_DATE} from "./variables";

export type MessageType =
    | 'new_project_name'
    | 'new_project_words_start'
    | 'new_project_words_goal'
    | 'change_name'
    | 'update_words'

export type TextSessionData = {
    type: MessageType
}

export type NewProjectData = TextSessionData & {
    projectName?: string
    wordsStart?: string
}

export type SimpleProjectData = TextSessionData & {
    projectId?: number
}

export type BaseTextCommand<T = TextSessionData> = {
    type: MessageType,
    next?: MessageType,
} & ({
    inputType: 'number',
    handler: (ctx: ContextWithSession<TextMessageContext>, userInput: number, sessionData: T) => Promise<void>
    }|
    {
        inputType: 'string',
        handler: (ctx: ContextWithSession<TextMessageContext>, userInput: string, sessionData: T) => Promise<void>
    })

async function projectNameHandler(ctx: ContextWithSession, userInput: string, sessionData: NewProjectData): Promise<void> {
    await ctx.reply(texts.setStart);
    sessionData.projectName = userInput
}

async function createProjectCommand(ctx: ContextWithSession, projectName: string, wordsStart: number, goal: number): Promise<void> {
    const {id: userId} = ctx.from

    const today = getToday()
    const dateEnd = MARATHON_END_DATE

    const remainingDays = getRemainingDays(today, dateEnd)

    const projectId = db.createProject(userId, projectName, getTodayString(), dateToString(dateEnd), wordsStart, goal)

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

const DEFAULT_PROJECT_NAME = 'Без названия'

async function wordsStartHandler(ctx: ContextWithSession, userInput: number, sessionData: NewProjectData): Promise<void> {
    const {projectName = DEFAULT_PROJECT_NAME} = sessionData
    //todo remove after enabling custom goal
    await createProjectCommand(ctx, projectName, userInput, 50000)
}

async function currentWordsHandler(ctx: ContextWithSession, currentWords: number, sessionData: SimpleProjectData): Promise<void> {
    const {projectId} = sessionData
    if (projectId === undefined) {
        return
        // throw error?
    }

    const todayStr = getTodayString()
    const [project, result] = await  Promise.all([db.getProject(projectId), db.getPrevDayResult(projectId, todayStr)])

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


export type TextCommand = BaseTextCommand<NewProjectData> | BaseTextCommand<SimpleProjectData> | BaseTextCommand

export const textInputCommands: TextCommand[] = [
    {
        type: 'new_project_name',
        inputType: 'string',
        next: 'new_project_words_start',
        handler: projectNameHandler
    },
    {
        type: 'new_project_words_start',
        inputType: 'number',
        handler: wordsStartHandler
    },
    {
        type: 'update_words',
        inputType: "number",
        handler: currentWordsHandler
    },
]