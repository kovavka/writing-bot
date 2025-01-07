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


export const bot = new Telegraf(TELEGRAM_BOT_TOKEN_PERO);
bot.use(session());

const MARATHON_END_STR = '2025-01-31'
const MARATHON_END_DATE = moment(MARATHON_END_STR, DATE_FORMAT)


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

function createProjectCommand(ctx, userId, projectName, wordsStart, goal) {
    const today = getToday()
    const dateEnd = MARATHON_END_DATE

    const remainingDays = getRemainingDays(today, dateEnd)

    db.createProject(userId, projectName, getTodayString(), dateToString(dateEnd), wordsStart, goal).then(id => {
        const dailyGoal = Math.ceil(goal / remainingDays)
        ctx.reply(texts.projectCreated(wordsStart + goal, remainingDays, dailyGoal),
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            buttons.setToday(id),
                            buttons.statistics(id),
                        ],
                    ],
                },
            });
    }).catch(err => {
        sendErrorToAdmin(err)
        ctx.reply(errors.generic);
    })
}

bot.on('text', (ctx) => {
    try {
        const {id: userId} = ctx.from
        const userInput = ctx.message.text;

        initSession(ctx)

        const sessionData = ctx.session[userId]

        if (sessionData == null) {
            ctx.reply(errors.unknown);
            return
        }

        if (sessionData.type === 'new_project') {
            if (sessionData.stage === 'name') {
                // todo check input by inputType
                ctx.reply(texts.setStart);
                // todo create chain of commands
                sessionData.stage = 'wordsStart'
                sessionData.inputType = 'number'
                sessionData.projectName = userInput
            } else if (sessionData.stage === 'wordsStart') {
                const start = parseInt(userInput);
                // todo check input by inputType

                const {projectName} = sessionData
                //todo remove after enabling custom goal
                createProjectCommand(ctx, userId, projectName, start, 50000)

                clearSession(ctx)
            } else {
                // todo error
            }
        } else if (sessionData.waitingForProjectName) {
            if (userInput != null && !(/('|--|;)/.test(userInput))) {
                ctx.reply(texts.setStart);

                sessionData.waitingForProjectName = false;
                sessionData.projectName = userInput
                sessionData.waitingForWordsStart = true;
            } else {
                ctx.reply(errors.nameInvalid);
            }
        } else if (sessionData.waitingForProjectNewName) {
            if (userInput != null && !(/('|--|;)/.test(userInput))) {
                const {projectId} = sessionData

               db.renameProject(projectId, userInput)
                   .then(() => {
                       ctx.reply(texts.projectRenamed, {
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
                   }).catch((err) => {
                       ctx.reply(errors.generic);
                       sendErrorToAdmin(err)
                   })

                sessionData.waitingForProjectNewName = false;
            } else {
                ctx.reply(errors.nameInvalid);
            }
        } else if (sessionData.waitingForWordsStart) {
            const start = parseInt(userInput);
            if (!isNaN(start)) {
                const {projectName} = sessionData
                //todo remove after enabling custom goal
                createProjectCommand(ctx, userId, projectName, start, 50000)

                sessionData.waitingForWordsStart = false;

                // ctx.reply(texts.setGoal);
                // sessionData.wordsStart = start
                // sessionData.waitingForWordsGoal = true;
            } else {
                ctx.reply(errors.numberInvalid);
            }
        // } else if (sessionData.waitingForWordsGoal) {
        //     const goal = parseInt(userInput);
        //     if (!isNaN(goal) && goal > 0) {
        //
        //         const {projectName, wordsStart} = sessionData
        //
        //         createProjectCommand(ctx, userId, projectName, wordsStart, goal)
        //
        //         sessionData.waitingForWordsGoal = false;
        //     } else {
        //         ctx.reply(errors.numberInvalid);
        //     }
        } else if (sessionData.waitingForCurrentWords && sessionData.projectId != null) {
            const {projectId} = sessionData
            const currentWords = parseInt(userInput);
            if (!isNaN(currentWords)) {
                const todayStr = getTodayString()
                Promise.all([db.getProject(projectId), db.getPrevDayResult(projectId, todayStr)]).then(([project, result]) => {
                    const prevWords = result != null ? result.words : project.wordsStart
                    const wordsDiff = currentWords - prevWords

                    db.setResult(projectId, currentWords, todayStr)

                    const goalAchieved = currentWords >= project.wordsStart + project.wordsGoal
                    ctx.reply(goalAchieved ? texts.todayAchieved : wordsDiff >= 0 ? texts.todaySaved(wordsDiff) : texts.todaySavedNegative(wordsDiff), {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    buttons.setToday(projectId),
                                    buttons.statistics(projectId),
                                ],
                            ],
                        },
                    });
                }).catch((err) => {
                    ctx.reply(errors.generic);
                    sendErrorToAdmin(err)
                 })


                sessionData.waitingForCurrentWords = false;
            } else {
                ctx.reply(errors.numberInvalid);
            }
        } else if (sessionData.waitingForUserName) {
            if (userInput != null && !(/('|--|;)/.test(userInput))) {
                db.updateUser(userId, userInput)

                ctx.reply(texts.userNameSet, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                buttons.newProject
                            ]
                        ]
                    },
                });

                sessionData.waitingForUserName = false;
            } else {
                ctx.reply(errors.nameInvalid);
            }
        } else if (sessionData.waitingForNewUserName) {
            if (userInput != null && !(/('|--|;)/.test(userInput))) {
                db.updateUser(userId, userInput)

                ctx.reply(texts.userNameUpdated , {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                buttons.newProject,
                                buttons.allProjects
                            ]
                        ]
                    },
                });

                sessionData.waitingForNewUserName = false;
            } else {
                ctx.reply(errors.nameInvalid);
            }
        } else {
            ctx.reply(errors.unknown);
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
