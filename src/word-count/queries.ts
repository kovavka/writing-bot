// todo
import {SessionContext, SimpleContext} from "../shared/types";
import {texts} from "../copy/pero";
import * as commands from "./commands";

export type QueryType = 'new_project' | 'all_projects' | 'change_name'

export type MessageType = 'new_project' | 'change_name'


export type SessionData =  {
    type: MessageType
    inputType: 'number' | 'string'
    stage: string
}


export type NewProjectData = SessionData & {
    type: 'new_project'
    stage: 'name' | 'wordsStart' | 'wordsGoal'
    projectName?: string
}

export async function newProjectQuery(ctx: SessionContext): Promise<void> {
    const {id: userId} = ctx.from
    ctx.session[userId] = <NewProjectData>{
        type: 'new_project',
        inputType: 'string',
        stage: 'name'
    }

    await ctx.reply(texts.setName);
}

export const queryMap: {[key in QueryType]: (ctx: SessionContext) => Promise<void>} = {
    'new_project': newProjectQuery,
    'all_projects': commands.allProjects,
}