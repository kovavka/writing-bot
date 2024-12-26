// const TelegramBot = require('node-telegram-bot-api');
const { Telegraf, session } = require('telegraf');
require('dotenv').config();

const {getChart} = require('./chart')
const commands = require('./commands')

const db  = require('./data-base')

const { TELEGRAM_BOT_TOKEN_PERO, ADMIN_ID } = process.env

const bot = new Telegraf(TELEGRAM_BOT_TOKEN_PERO);
bot.use(session());

// todo add try catch everywhere

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
    nameInvalid: `Ухх! Это очень опасное заклинание. Лучше назвать гримуар иначе`,
    numberInvalid: `Ой, мне нужно было число, а не заклинание`,
    generic: `Ой, кажется, это заклинание прошло не очень удачно. Пожалуйста, обратись к главному магистру`,
}

const wordForms = {
    words: ['слово', 'слова', 'слов'],
    days: ['день', 'дня', 'дней'],
}

const texts = {
    welcome: `Ууху я - Перо, самый умный фамильяр. Буду записывать твой прогресс, ни одно слово не упущу, так и знай! Ухуу!`,
    setName: `Как будет называться твоя волшебная книга?`,
    setStart: `Угу... Хорошее имя, ведьмочка! Теперь, сколько слов у тебя уже есть?\nОбрати внимание, ведьма, СЛОВ, а не знаков. Если ещё только начинаешь своё заклинание, пиши 0`,
    setGoal: `Сколько слов ты хочешь написать за это время?`,
    projectCreated: (finalWords, daysLeft, dayGoal)=> `WriteUp! Время писать! Через ${daysLeft} ${getWordForm(daysLeft, wordForms.days)} В твоём гримуаре должно быть ${finalWords} ${getWordForm(finalWords, wordForms.words)}.
Твоя цель на каждый день: ${dayGoal} ${getWordForm(dayGoal, wordForms.words)}`,
    allProjects: `Ууху, вот все ваши гримуары`,
    zeroProjects: `Кажется, у тебя ещё нет гримуаров, но ты можешь создать новый`,
    selectProject: `Ууху, открываю гримуар`,
    setToday: `Надеюсь, твой день прошел хорошо, расскажи Перо, сколько теперь слов в твоём гримуаре?`,
    todaySaved: (wordsDiff) => `Вот это да, какая талантливая ведьмочка мне попалась! Сегодня ты ${wordsDiff >0 ? 'написала' : 'вычеркнула'} ${Math.abs(wordsDiff)} ${getWordForm(wordsDiff, wordForms.words)}. Заклинание все крепче, у нас все получается!`,
    todayAchieved: `Надо же, ведьмочка, теперь твоя цель выполнена!`,
    statistics: (daysLeft, wordsLeft) => `Впереди еще ${daysLeft} ${getWordForm(daysLeft, wordForms.days)} и не хватает ${wordsLeft} ${getWordForm(wordsLeft, wordForms.words)}. Я верю в тебя, моя ведьмочка!`,
    statisticsAchieved: `Молодец, ведьмочка, ты дописала манускрипт!`,
}

const buttons = {
    newProject: { text: 'Новый гримуар 📜', callback_data: `new_project` },
    allProjects: { text: 'Гримуары 📚', callback_data: `all_projects` },
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

function getRemainingDays(from, to) {
    return Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
}


bot.start((ctx) => {
    const {id: userId, first_name, last_name} = ctx.from

    db.addUser(userId, `${first_name} ${last_name}`)
    ctx.reply(texts.welcome, {
        reply_markup: {
            inline_keyboard: [
                [
                    buttons.newProject
                ],
            ],
        },
    });
});

function sendStatistics(ctx, projectId) {
    Promise.all([db.getDayResults(projectId), db.getProject(projectId)]).then(([rows, project]) => {
        const data = []
        const today = new Date()
        const {dateStart: dateStartStr, dateEnd: dateEndStr, wordsStart, wordsGoal} = project

        const dateStart = new Date(dateStartStr)
        const dateEnd = new Date(dateEndStr)
        const projectLength = getRemainingDays(dateStart, dateEnd)
        const remainingDays = getRemainingDays(today, dateEnd)
        const daysPassed = getRemainingDays(dateStart, today) - 1

        rows.forEach(({date, words}) => {
            const index = getRemainingDays(dateStart, new Date(date)) - 1
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

bot.command('all', (ctx) => {
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
})

bot.command('help', (ctx) => {
    ctx.reply(texts.welcome, {
        reply_markup: {
            inline_keyboard: [
                [
                    buttons.newProject,
                    buttons.allProjects,
                ],
            ],
        },
    });

})

bot.on('callback_query', (ctx) => {
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
    } else if (callbackData.startsWith('stat_project_')) {
        const [,,projectId] = callbackData.split('_');

        sendStatistics(ctx, projectId)

        ctx.answerCbQuery();
    } else if (callbackData.startsWith('project_')) {
        const [,projectId] = callbackData.split('_');

        ctx.reply(texts.selectProject,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            buttons.setToday(projectId),
                            buttons.statistics(projectId),
                        ],
                    ],
                },
            });

        ctx.answerCbQuery();
    } else {
        ctx.reply(errors.unknown);
        ctx.answerCbQuery();
    }
});

function getDateStr(date) {
    return (date ?? new Date()).toISOString().split('T')[0];
}

function createProjectCommand(ctx, userId, projectName, wordsStart, goal) {
    const today = new Date()
    const dateEnd = new Date(2025, 0, 31)

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
            Promise.all([db.getProject(projectId), db.getPrevDayResult(projectId)]).then(([project, result]) => {
                const prevWords = result != null ? result.words : project.wordsStart
                const wordsDiff = currentWords - prevWords

                db.setResult(projectId, currentWords)

                const goalAchieved = currentWords >= project.wordsStart + project.wordsGoal
                ctx.reply(goalAchieved ? texts.todayAchieved : texts.todaySaved(wordsDiff), {
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
    } else {
        ctx.reply(errors.unknown);

    }

});


bot.launch();

console.log('Bot is running...');

process.on('SIGINT', () => {
    db.close()
    process.exit(); // Ensure the process exits
});
