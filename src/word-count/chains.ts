import {ContextWithSession, SimpleContext, TextMessageContext} from "../shared/types";
import {buttons, errors, texts} from "../copy/pero";
import * as commands from "./commands";
import {dateToString, getToday, getTodayString} from "../shared/utils";
import {getRemainingDays} from "./utils";
import db from './database'
import {MARATHON_END_DATE} from "./variables";

export type MessageType = 'new_project' | 'change_name' | 'update_words'


export type TextSessionData = {
    type: MessageType
    stage: string
    // stageData: {[key in string]: number | string}
}


type NewProjectStages = 'projectName' | 'wordsStart' | 'wordsGoal'

export type NewProjectData = TextSessionData & {
    projectName?: string
    wordsStart?: string
}

export type SimpleProjectData = TextSessionData & {
    projectId?: number
}

export type ChainStage<T, D = TextSessionData> = {
    name: T,
    nextStage?: T,
} & ({
    inputType: 'number',
    handler: (ctx: ContextWithSession<TextMessageContext>, userInput: number, sessionData: D) => Promise<void>
    }|
    {
        inputType: 'string',
        handler: (ctx: ContextWithSession<TextMessageContext>, userInput: string, sessionData: D) => Promise<void>
    })

export type ChainCommand<T, D> = {
    type: MessageType
    stages: ChainStage<T, D>[]
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

const newProjectChain: ChainCommand<NewProjectStages, NewProjectData> = {
    type: 'new_project',
    stages: [
        {
            name: 'projectName',
            inputType: 'string',
            nextStage: 'wordsStart',
            handler: projectNameHandler
        },
        {
            name: 'wordsStart',
            inputType: 'number',
            handler: wordsStartHandler
        },
    ]
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

const updateWordsChain: ChainCommand<'update_words', NewProjectData> = {
    type: 'update_words',
    stages: [
        {
            name: 'update_words',
            inputType: "number",
            handler: currentWordsHandler
        },

    ]
}

export const textInputChain = [
    newProjectChain,
    updateWordsChain
]