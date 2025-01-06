import { Telegraf, session } from 'telegraf'
import moment from 'moment-timezone'
import { getChart } from './chart'
import db from './database'
import {TIME_ZONE, DATE_FORMAT, TELEGRAM_BOT_TOKEN_PERO, ADMIN_ID} from '../shared/variables'
import {
    isAdmin,
    initSession,
    clearSession, getToday, dateToString, getTodayString
} from '../shared/utils'
import * as commands from "./commands";
import {buttons, errors, texts} from "../copy/pero";


export const bot = new Telegraf(TELEGRAM_BOT_TOKEN_PERO);
bot.use(session());

const MARATHON_END_STR = '2025-01-31'
const MARATHON_END_DATE = moment(MARATHON_END_STR, DATE_FORMAT)


function sendErrorToAdmin(err) {
    bot.telegram.sendMessage(ADMIN_ID, `Something went wrong. ${err}`)
        .catch(() => {});
}


function getRemainingDays(dateFrom, dateTo) {
    // including both
    return dateTo.startOf('day').diff(dateFrom.startOf('day'), 'days') + 1
}

bot.start((ctx) => {
    try {
        // init and clear
        ctx.session = {};

        const {id: userId, first_name, last_name} = ctx.from

        // just in case create user right away
        db.getUser(userId).then(user => {
            if (user == null) {
                db.addUser(userId, `${first_name} ${last_name}`)
                ctx.session[userId] = { waitingForUserName: true };
                ctx.reply(texts.welcome)
            } else {
                ctx.reply(texts.welcomeBack(user.name), {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                buttons.allProjects
                            ]
                        ]
                    },
                });
            }
        }).catch((err) => {
            ctx.reply(errors.generic);
            sendErrorToAdmin(err)
        })
    } catch (err) {
        ctx.reply(errors.generic);
        sendErrorToAdmin(err)
    }
});

function sendStatistics(ctx, projectId) {
    Promise.all([db.getDayResults(projectId), db.getProject(projectId)]).then(([rows, project]) => {
        const data = []
        const today = getToday()
        const {dateStart: dateStartStr, dateEnd: dateEndStr, wordsStart, wordsGoal} = project

        const dateStart = moment(dateStartStr, DATE_FORMAT)
        const dateEnd = moment(dateEndStr, DATE_FORMAT)
        const projectLength = getRemainingDays(dateStart, dateEnd)
        const remainingDays = getRemainingDays(today, dateEnd)
        const daysPassed = getRemainingDays(dateStart, today)

        rows.forEach(({date, words}) => {
            const rowDate = moment(date, DATE_FORMAT)
            const index = getRemainingDays(dateStart, rowDate) - 1
            data[index] = words
        })

        let prevRes = 0
        // we use daysPassed to render bars until current date
        for(let i = 0; i < daysPassed; i++) {
            if (data[i] !== undefined) {
                prevRes = data[i]
            } else {
                data[i] = prevRes
            }
        }

        getChart(projectLength, data, wordsStart, wordsGoal + wordsStart).then((value) => {
            const wordsLeft = wordsGoal + wordsStart - prevRes
            ctx.replyWithPhoto({ source: value }, { caption: wordsLeft <= 0 ? texts.statisticsAchieved : texts.statistics(remainingDays, wordsLeft),
                reply_markup: {
                    inline_keyboard: [
                        [
                            buttons.setToday(projectId),
                        ],
                    ],
                }, });

            ctx.answerCbQuery();
        }).catch((err) => {
            ctx.reply(errors.generic);
            sendErrorToAdmin(err)

            ctx.answerCbQuery();
        })
    }).catch((err) => {
        ctx.reply(errors.generic);
        sendErrorToAdmin(err)
    })
}

function allProjectsCommand(ctx) {
    clearSession(ctx)

    const {id: userId} = ctx.from

    db.getProjects(userId).then((rows) => {
        if (rows.length === 0)  {
            ctx.reply(texts.zeroProjects, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            buttons.newProject
                        ]
                    ]
                },
            });
        } else {
            ctx.reply(texts.allProjects, {
                reply_markup: {
                    inline_keyboard:
                        rows.map(row => ([{ text: row.name, callback_data: `project_${row.id}` }]))

                },
            });
        }
    }).catch((err) => {
        sendErrorToAdmin(err)
        ctx.reply(errors.generic);
    })
}

bot.command('all', (ctx) => {
    try {
        allProjectsCommand(ctx)
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

function getAdminStat(ctx) {
    if (isAdmin(ctx)) {
        const dateFrom = '2024-12-20'
        db.getStatistics(dateFrom, MARATHON_END_STR)
            .then(rows => {
                const resultByUser = {}
                rows.forEach(row => {
                    const {userId, userName, projectName, wordsStart, latestWords} = row
                    if (resultByUser[userId] === undefined) {
                        resultByUser[userId] = []
                    }

                    const userResult = resultByUser[userId]
                    userResult.push({
                        userName,
                        projectName,
                        wordsStart,
                        latestWords: latestWords != null ? latestWords : wordsStart,
                    })
                })

                const data = Object.entries(resultByUser).map(([userId, result]) => {
                    if (result.length === 0) {
                        return ''
                    }

                    const {userName} = result[0]
                    const startSum = result.reduce((partialSum, a) => partialSum + a.wordsStart, 0);
                    const wordsSum = result.reduce((partialSum, a) => partialSum + a.latestWords, 0);
                    const diff = wordsSum - startSum
                    const joinedName = result.map(x => x.projectName).join('; ')

                    return {userName, joinedName, wordsSum, startSum, diff}
                }).map(x =>  `${x.userName} | ${x.joinedName} | ${x.startSum} | ${x.wordsSum} | ${x.diff}`)

                ctx.reply(`Имя | Название | Старт | Всего | Разница\n\n${data.join('\n')}`);
            }).catch((err) => {
            ctx.reply(errors.generic);
            sendErrorToAdmin(err)
        })
    } else {
        ctx.reply(errors.unknown)
    }
}

bot.command('stat', (ctx) => {
    try {
        clearSession(ctx)
        getAdminStat(ctx)
    }  catch (err) {
        ctx.reply(errors.generic);
        sendErrorToAdmin(err)
    }
})

bot.command('statToday', (ctx) => {
    try {
        clearSession(ctx)

        if (isAdmin(ctx)) {
            // today by server time
            const today = moment().format(DATE_FORMAT)
            const dateFrom = '2024-12-20'
            db.getTodayStatistics(today)
                .then(rows => {
                    console.log(rows)
                    const resultByUser = {}
                    rows.forEach(row => {
                        const {userId, userName, wordsStart, lastResultWords, todayWords } = row
                        const prevWords = lastResultWords != null ? lastResultWords : wordsStart

                        const projectResult = {
                            userName,
                            wordsDiff: (todayWords != null) ? todayWords - prevWords : 0,
                        }

                        if (resultByUser[userId] === undefined) {
                            resultByUser[userId] = projectResult
                        } else {
                            const {wordsDiff} = resultByUser[userId]
                            resultByUser[userId] = {
                                userName: userName,
                                wordsDiff: wordsDiff + projectResult.wordsDiff
                            }
                        }
                    })

                    const data = Object.entries(resultByUser).map(([userId, result]) => {
                        const {userName, wordsDiff } = result

                        return {userName, wordsDiff}
                    })

                    const dataSorted = data.sort((a,b) => b.wordsDiff - a.wordsDiff)
                        .map(x =>  `${x.userName}: ${x.wordsDiff}`)

                    ctx.reply(dataSorted.join('\n'));

                }).catch((err) => {
                ctx.reply(errors.generic);
                sendErrorToAdmin(err)
            })
        } else {
            ctx.reply(errors.unknown)
        }
    }  catch (err) {
        ctx.reply(errors.generic);
        sendErrorToAdmin(err)
    }
})

bot.on('callback_query', (ctx) => {
    try {
        const callbackData = ctx.callbackQuery.data;
        const {id: userId} = ctx.from

        initSession(ctx)
        if (callbackData === 'new_project') {
            ctx.session[userId] = { waitingForProjectName: true };

            ctx.reply(texts.setName);
            ctx.answerCbQuery();
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

            sendStatistics(ctx, projectId)

            ctx.answerCbQuery();
        } else if (callbackData === 'all_projects') {
            allProjectsCommand(ctx)
            ctx.answerCbQuery();
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

        if (sessionData.waitingForProjectName) {
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
