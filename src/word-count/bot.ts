import { Telegraf, session } from 'telegraf'
import { callbackQuery } from "telegraf/filters"
import moment from 'moment-timezone'
import db from './database'
import {TIME_ZONE, DATE_FORMAT, TELEGRAM_BOT_TOKEN_PERO, ADMIN_ID} from '../shared/variables'
import {
    initSession,
    clearSession, getToday, dateToString, getTodayString
} from '../shared/utils'
import * as commands from "./commands";
import {buttons, errors, texts} from "../copy/pero";
import {getRemainingDays} from "./utils";
import {adminStatToday} from "./commands";
import {queryMap} from "./queries";
import {ContextWithSession, TextMessageContext} from "../shared/types";
import {TextCommand, MessageType, BaseTextCommand, textInputCommands, TextSessionData} from "./text-commands";

export const bot = new Telegraf(TELEGRAM_BOT_TOKEN_PERO);
bot.use(session());


// todo type
function sendErrorToAdmin(err: any) {
    bot.telegram.sendMessage(ADMIN_ID, `Something went wrong. ${err}`)
        .catch(() => {});
}

bot.start(async (ctx) => {
    try {
       await commands.start(ctx)
    } catch (err) {
        ctx.reply(errors.generic);
        sendErrorToAdmin(err)
    }
});

bot.command('all', (ctx) => {
    try {
        clearSession(ctx)
        commands.allProjects(ctx)
    }  catch (err) {
        ctx.reply(errors.generic);
        sendErrorToAdmin(err)
    }
})

bot.command('help', (ctx) => {
    try {
        clearSession(ctx)
        ctx.reply(texts.help, {
            reply_markup: {
                inline_keyboard: [
                    [
                        buttons.newProject,
                        buttons.allProjects,
                    ],
                ],
            },
        });
    }  catch (err) {
        ctx.reply(errors.generic);
        sendErrorToAdmin(err)
    }
})

bot.command('settings', (ctx) => {
    try {
        clearSession(ctx)
        ctx.reply(texts.settings, {
            reply_markup: {
                inline_keyboard: [
                    [
                        buttons.changeName,
                    ],
                ],
            },
        });
    }  catch (err) {
        ctx.reply(errors.generic);
        sendErrorToAdmin(err)
    }
})

bot.command('status', commands.status)

bot.command('stat', async (ctx) => {
    try {
        clearSession(ctx)
        await commands.adminStat(ctx)
    }  catch (err) {
        ctx.reply(errors.generic);
        sendErrorToAdmin(err)
    }
})

bot.command('statToday', (ctx) => {
    try {
        clearSession(ctx)
        commands.adminStatToday(ctx)
    }  catch (err) {
        ctx.reply(errors.generic);
        sendErrorToAdmin(err)
    }
})

bot.on('callback_query', async (ctx) => {
    try {
        if (!ctx.has(callbackQuery("data"))) {
            // todo add error
            return
        }

        const callbackData = ctx.callbackQuery.data;
        const {id: userId} = ctx.from

        const sessionContext = initSession(ctx)

        const [, queryCommand] = Object.entries(queryMap).find(([key]) => callbackData.startsWith(key)) ?? []
        console.log(callbackData)
        if (queryCommand !== undefined) {
            // todo also clear session when bot receives all data it needs
            clearSession(ctx)
            await queryCommand(sessionContext)
            await sessionContext.answerCbQuery();
        } else if (callbackData.startsWith('update_project_')) {
            const [,,projectId] = callbackData.split('_');

            ctx.session[userId] = {
                waitingForCurrentWords: true,
                projectId,
            };

            db.getCurrentWords(projectId).then((row) => {
                const prevWords = row.latestWords ?? row.wordsStart

                ctx.reply(texts.setToday(prevWords));
                ctx.answerCbQuery();
            }).catch((err) => {
                ctx.reply(errors.generic);
                sendErrorToAdmin(err)
                ctx.answerCbQuery();
            })


        } else if (callbackData.startsWith('change_name')) {
            ctx.session[userId] = {
                waitingForNewUserName: true,
            };

            ctx.reply(texts.changeName);
            ctx.answerCbQuery();
        } else if (callbackData.startsWith('stat_project_')) {
            const [,,projectId] = callbackData.split('_');

            await commands.projectStatistics(ctx, projectId)
        } else if (callbackData.startsWith('project_')) {
            const [,projectId] = callbackData.split('_');

            db.getProject(projectId).then(row => {
                ctx.reply(texts.selectProject(row.name),
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

                ctx.answerCbQuery();
            }).catch(err => {
                ctx.reply(errors.generic);
                sendErrorToAdmin(err)
                ctx.answerCbQuery();
            })
        } else if (callbackData.startsWith('edit_project_')) {
            const [,,projectId] = callbackData.split('_');

            ctx.reply(texts.editProject,
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

            ctx.answerCbQuery();
        } else if (callbackData.startsWith('rename_project_')) {
            const [,,projectId] = callbackData.split('_');

            ctx.session[userId] = { waitingForProjectNewName: true, projectId };
            ctx.reply(texts.setName);

            ctx.answerCbQuery();
        } else if (callbackData.startsWith('remove_project_')) {
            const [,,projectId] = callbackData.split('_');
            const today =  getTodayString()
            db.hideProject(projectId, today).then(() => {
                ctx.reply(texts.projectRemoved,
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
                ctx.answerCbQuery();
            }).catch(err => {
                ctx.reply(errors.generic);
                sendErrorToAdmin(err)
                ctx.answerCbQuery();
            })
        } else {
            ctx.reply(errors.unknown);
            ctx.answerCbQuery();
        }
    }  catch (err) {
        ctx.reply(errors.generic);
        sendErrorToAdmin(err)
    }
});

function isValidString(userInput: string): boolean {
    return userInput != null && !(/('|--|;)/.test(userInput))
}

function isValidNumber(userInput: string): boolean {
    return userInput.length > 0 && /^\d+$/.test(userInput) && !isNaN(Number(userInput))
}

async function executeChainCommand(command: TextCommand, ctx: ContextWithSession<TextMessageContext>, sessionData: TextSessionData) {
    const userInput = ctx.message.text;

    if (command.inputType === 'number')  {
        if (!isValidNumber(userInput)) {
            await ctx.reply(errors.numberInvalid);
            return
        }

        const value = Number(userInput)
        await command.handler(ctx, value, sessionData)
    } else {
        if (!isValidString(userInput)) {
            await ctx.reply(errors.nameInvalid);
            return
        }

        await command.handler(ctx, userInput, sessionData)
    }

    if (command.next !== undefined) {
        sessionData.type = command.next
    } else {
        clearSession(ctx)
    }
}

// function getTextCommand<T>(type: MessageType) {
//     textInputCommands.find(x => x.type === sessionData.type)
// }

bot.on('text', async (ctx) => {
    try {
        const {id: userId} = ctx.from

        const sessionContext = initSession(ctx)

        const sessionData = sessionContext.session[userId] as TextSessionData

        if (sessionData == null) {
            await ctx.reply(errors.unknown);
            return
        }

        const textCommand = textInputCommands.find(x => x.type === sessionData.type)
        if (textCommand !== undefined) {
            await executeChainCommand(textCommand, sessionContext, sessionData)

        }
    }  catch (err) {
        ctx.reply(errors.generic);
        sendErrorToAdmin(err)
    }
});

console.log('Bot is running...');

process.on('SIGINT', () => {
    db.close()
    process.exit(); // Ensure the process exits
});
