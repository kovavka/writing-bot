// const TelegramBot = require('node-telegram-bot-api');
const { Telegraf, session } = require('telegraf');
const moment = require('moment-timezone');
require('dotenv').config();

const {getChart} = require('./chart')

const db  = require('./data-base')

const { TELEGRAM_BOT_TOKEN_PERO, ADMIN_ID } = process.env

const bot = new Telegraf(TELEGRAM_BOT_TOKEN_PERO);
bot.use(session());

const TIME_ZONE = 'Europe/Moscow'
const DATE_FORMAT = 'YYYY-MM-DD'

const MARATHON_END_STR = '2025-01-31'
const MARATHON_END_DATE = moment(MARATHON_END_STR, DATE_FORMAT)

function getWordForm(number, forms) {
   if (number % 10 === 1 && number % 100 !== 11) {
       return forms[0]
   }
   if (number % 10 > 1 && number % 10 < 5 && (number % 100 < 10 || number % 100 > 20)) {
        return forms[1]
   }

   return forms[2]
}

const errors = {
    unknown: `Перо знает много, но не понимает, что ведьмочка от него хочет. Используй заклинание /help`,
    nameInvalid: `Ухх! Это очень опасное заклинание. Лучше выбрать другое имя`,
    numberInvalid: `Ой, мне нужно было число, а не заклинание`,
    generic: `Ой, кажется, это заклинание прошло не очень удачно. Пожалуйста, обратись к главному магистру`,
}

const wordForms = {
    words: ['слово', 'слова', 'слов'],
    days: ['день', 'дня', 'дней'],
}

const texts = {
    help: `Ууху я - Перо, самый умный фамильяр. Буду записывать твой прогресс, ни одно слово не упущу, так и знай! Ухуу!`,
    welcome: `Ух, новая ведьмочка! Меня зовут Перо, я самый умный фамильяр. Буду записывать твой прогресс, ни одно слово не упущу, так и знай! Ухуу!\n\nА как мне называть тебя?`,
    userNameSet: `Приятно познакомиться! Теперь я могу помочь тебе создать твой первый гримуар`,
    userNameUpdated: `Приятно познакомиться!`,
    welcomeBack: (name) => `С возвращением, ${name}!`,
    setName: `Как будет называться твоя волшебная книга?`,
    setStart: `Угу... Хорошее имя, ведьмочка! Теперь, сколько слов у тебя уже есть?\nОбрати внимание, ведьма, СЛОВ, а не знаков. Если ещё только начинаешь своё заклинание, пиши 0`,
    setGoal: `Сколько слов ты хочешь написать за это время?`,
    projectCreated: (finalWords, daysLeft, dayGoal)=> `WriteUp! Время писать! Через ${daysLeft} ${getWordForm(daysLeft, wordForms.days)} в твоём гримуаре должно быть ${finalWords} ${getWordForm(finalWords, wordForms.words)}.
Твоя цель на каждый день: ${dayGoal} ${getWordForm(dayGoal, wordForms.words)}`,
    allProjects: `Ууху, вот все ваши гримуары`,
    zeroProjects: `Кажется, у тебя ещё нет гримуаров, но могу помочь тебе создать новый`,
    selectProject: `Ууху, открываю гримуар`,
    editProject: `Конечно, что ты хочешь поменять?`,
    projectRenamed: `Хорошее имя, ведьмочка!`,
    setToday: `Надеюсь, твой день прошел хорошо, расскажи Перо, сколько теперь слов в твоём гримуаре?`,
    todaySaved: (wordsDiff) => `Вот это да, какая талантливая ведьмочка мне попалась! Сегодня ты написала ${wordsDiff} ${getWordForm(wordsDiff, wordForms.words)}. Заклинание все крепче, у нас все получается!`,
    todaySavedNegative: (wordsDiff) => `Какая усердная ведьмочка мне попалась, всё редактирует и редактирует! Сегодня ты вычеркнула ${Math.abs(wordsDiff)} ${getWordForm(wordsDiff, wordForms.words)}.`,
    todayAchieved: `Надо же, ведьмочка, теперь твоя цель выполнена!`,
    statistics: (daysLeft, wordsLeft) => `Впереди еще ${daysLeft} ${getWordForm(daysLeft, wordForms.days)} и не хватает ${wordsLeft} ${getWordForm(wordsLeft, wordForms.words)}. Я верю в тебя, моя ведьмочка!`,
    statisticsAchieved: `Молодец, ведьмочка, ты дописала манускрипт!`,
    status: `Я здесь, ведьмочка. Ухуу!`,
    settings: `Чем я могу тебе помочь?`,
    changeName: `Разумеется, какое имя ты хочешь взять?`,
}

const buttons = {
    newProject: { text: 'Новый гримуар 📜', callback_data: `new_project` },
    allProjects: { text: 'Гримуары 📚', callback_data: `all_projects` },
    changeName: { text: 'Изменить имя 🦄', callback_data: `change_name` },
    editProject: (projectId) => ({ text: 'Редактировать ✏️', callback_data: `edit_project_${projectId}` }),
    renameProject: (projectId) => ({ text: 'Переименовать', callback_data: `rename_project_${projectId}` }),
    removeProject: (projectId) => ({ text: 'Удалить', callback_data: `remove_project_${projectId}` }),
    setToday: (projectId) => ({ text: 'Записать заклинание 🖋️', callback_data: `update_project_${projectId}` }),
    statistics: (projectId) => ({ text: 'Узнать будушее 🔮', callback_data: `stat_project_${projectId}` }),
}

function isAdmin(ctx) {
    const {id: userId} = ctx.from
    const ifAdmin = userId.toString() === ADMIN_ID

    if (!ifAdmin) {
        ctx.reply(errors.unknown);
    }

    return ifAdmin
}

function sendErrorToAdmin(err) {
    bot.telegram.sendMessage(ADMIN_ID, `Something went wrong. ${err}`)
        .catch(() => {});
}

function initSession(ctx) {
    if (ctx.session == null) {
        ctx.session = {};
    }
}

function clearSession(ctx) {
    const {id: userId} = ctx.from

    if (ctx.session != null) {
        ctx.session[userId] = {}
    }
}

function getRemainingDays(dateFrom, dateTo) {
    // including both
    return dateTo.startOf('day').diff(dateFrom.startOf('day'), 'days') + 1
}

function getToday() {
    const date = moment();
    return date.tz(TIME_ZONE);
}

function getDateStr(date = getToday()) {
    return date.tz(TIME_ZONE).format(DATE_FORMAT);
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

bot.command('status', (ctx) => {
    const time = getToday().tz(TIME_ZONE).format('HH:mm:ss')

    ctx.reply(`${texts.status}\nВремя: ${time}`)
})

bot.command('stat', (ctx) => {
    try {
        clearSession(ctx)

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
                            wordsWritten: (latestWords != null && latestWords > wordsStart) ? latestWords - wordsStart : 0,
                        })
                    })

                    const data = Object.entries(resultByUser).map(([userId, result]) => {
                        if (result.length === 0) {
                            return ''
                        }

                        const {userName} = result[0]
                        const wordsSum = result.reduce((partialSum, a) => partialSum + a.wordsWritten, 0);
                        let details = ''

                        if (result.length > 1) {
                            details = result.map(x => `${x.projectName} - ${x.wordsWritten}`).join(', ')
                        } else {
                            details = result[0].projectName
                        }

                        return {userName, wordsSum, details}
                    })

                    const dataSorted = data.sort((a,b) => b.wordsSum - a.wordsSum)
                        .map(x =>  `${x.userName}: ${x.wordsSum} (${x.details})`)

                    ctx.reply(`Статистика марафона:\n\n${dataSorted.join('\n')}`);
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

            ctx.reply(texts.setToday);
            ctx.answerCbQuery();
        } else if (callbackData.startsWith('change_name')) {
            ctx.session[userId] = {
                waitingForUserName: true,
                changingName: true,
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

            ctx.reply(texts.selectProject,
                {
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
            ctx.reply(texts.setName,
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

    db.createProject(userId, projectName, getDateStr(today), getDateStr(dateEnd), wordsStart, goal).then(id => {
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
        } if (sessionData.waitingForProjectNewName) {
            if (userInput != null && !(/('|--|;)/.test(userInput))) {
                const {projectId} = sessionData

               db.updateProject(projectId, userInput)
                   .then(() => {
                       ctx.reply(texts.projectRenamed);
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
                const todaySrt = getDateStr(getToday())
                Promise.all([db.getProject(projectId), db.getPrevDayResult(projectId, todaySrt)]).then(([project, result]) => {
                    const prevWords = result != null ? result.words : project.wordsStart
                    const wordsDiff = currentWords - prevWords

                    db.setResult(projectId, currentWords, todaySrt)

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
                if (sessionData.changingName) {
                    ctx.reply(texts.userNameUpdated , {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    buttons.allProjects
                                ]
                            ]
                        },
                    });
                } else {
                    ctx.reply(texts.userNameSet, {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    buttons.newProject
                                ]
                            ]
                        },
                    });
                }
                sessionData.waitingForUserName = false;
                sessionData.changingName = false;
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

bot.launch();

console.log('Bot is running...');

process.on('SIGINT', () => {
    db.close()
    process.exit(); // Ensure the process exits
});
