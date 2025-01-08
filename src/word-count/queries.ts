// todo
import {ContextWithSession, SimpleContext} from "../shared/types";
import {texts} from "../copy/pero";
import * as commands from "./commands";
import {MessageType} from "./text-commands";

export type QueryType = 'new_project' | 'all_projects' | 'change_name'

type QueryCommand = {
    type: QueryType
    handler: (ctx: ContextWithSession) => Promise<void>
    chainCommand?: MessageType
}

export const queryMap: QueryCommand[] = [
    {
        type: 'new_project',
        handler: async (ctx: ContextWithSession) => { await ctx.reply(texts.setName) },
        chainCommand: 'new_project'
    },
    {
        type: 'all_projects',
        handler: commands.allProjects,
    },
]
