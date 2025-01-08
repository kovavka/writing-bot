// todo
import {ContextWithSession, SimpleContext} from "../shared/types";
import {texts} from "../copy/pero";
import * as commands from "./commands";
import {TextSessionData} from "./text-commands";

export type QueryType = 'new_project' | 'all_projects' | 'change_name'

export async function newProjectQuery(ctx: ContextWithSession): Promise<void> {
    const {id: userId} = ctx.from
    // todo get data from the corresponding chain
    ctx.session[userId] = <TextSessionData>{
        type: 'new_project',
        stage: 'name'
    }

    await ctx.reply(texts.setName);
}

export const queryMap: {[key in QueryType]: (ctx: ContextWithSession) => Promise<void>} = {
    'new_project': newProjectQuery,
    'all_projects': commands.allProjects,
}
