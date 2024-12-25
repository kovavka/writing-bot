// const TelegramBot = require('node-telegram-bot-api');
const { Telegraf, session } = require('telegraf');
require('dotenv').config();

const {getChart} = require('./chart')
const commands = require('./commands')

const {
    addUser,
    createProject,
    getDayResults,
    getProjects,
    getProject,
    setResult,
    close
} = require('./data-base')

const { TELEGRAM_BOT_TOKEN_PERO, ADMIN_ID } = process.env

// Create a bot instance
// const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
const bot = new Telegraf(TELEGRAM_BOT_TOKEN_PERO);
bot.use(session());

// todo add try catch everywhere

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

function getWordForm(number, forms) {
   if (number % 10 === 1 && number % 100 !== 11) {
       return forms[0]
   }
   if (number % 10 > 1 && number % 10 < 5 && (number % 100 < 10 || number % 100 > 20)) {
        return forms[1]
   }

   return forms[2]
}

const texts = {
    welcome: `Ууху я - Перо, самый умный фамильяр. Буду записывать твой прогресс, ни одно слово не упущу, так и знай! Ухуу!`,
    setName: `Как будет называться твоя волшебная книга?`,
    setStart: `Угу... Хорошее имя, ведьмочка! Теперь, сколько слов у тебя уже есть?\nОбрати внимание, ведьма, СЛОВ, а не знаков. Если ещё только начинаешь своё заклинание, пиши 0`,
    setGoal: `Сколько слов ты хочешь написать за январь?`,
    projectCreated: (days, words)=> `WriteUp! Время писать! До конца марафона осталось ${days} ${getWordForm(days, wordForms.days)}. Твоя цель на каждый день: ${words} ${getWordForm(words, wordForms.words)}`,
    allProjects: `Ууху, вот все ваши гримуары`,
    zeroProjects: `Кажется, у тебя ещё нет гримуаров, но ты можешь создать новый`,
    selectProject: `Ууху, открываю гримуар`,
    setToday: `Надеюсь, твой день прошел хорошо, расскажи Перо, сколько слов тебе удалось написать сегодня?`,
    todaySaved: (words) => `Вот это да, какая талантливая ведьмочка мне попалась! Сегодня ты создала ${words} ${getWordForm(words, wordForms.words)}. Заклинание все крепче, у нас все получается!`,
    statistics: (days, words) => `Впереди еще ${days} ${getWordForm(days, wordForms.days)} и не хватает ${words} ${getWordForm(words, wordForms.words)}. Я верю в тебя, моя ведьмочка!`,
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

function getRemainingDaysInMonth() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // Month is 0-indexed (0 = January, 11 = December)

    // Get the last day of the current month
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0); // Day 0 gives the last day of the previous month

    // Calculate the difference in days
    return Math.ceil((lastDayOfMonth - today) / (1000 * 60 * 60 * 24)) + 1;
}


bot.start((ctx) => {
    const {id: userId, first_name, last_name} = ctx.from

    addUser(userId, `${first_name} ${last_name}`)
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


    Promise.all([getDayResults(projectId), getProject(projectId)]).then(([rows, project]) => {
        const data = []
        const {start, goal} = project

        const days = 31

        rows.forEach(({day, result}) => {
            data[day - 1] = result
        })

        // можем учитывать до текущего дня

        const today = new Date().getDate()

        // todo start with actual words start
        let prevRes = 0
        for(let i = 0; i < today; i++) {
            if (data[i] !== undefined) {
                prevRes = data[i]
            } else {
                data[i] = prevRes
            }
        }

        // todo check if goal is achieved
        const daysLeft = days - today + 1
        const wordsLeft = goal + start - prevRes
        console.log(goal, prevRes)
        // todo fix goal
        getChart(days, data, start, goal + start).then((value) => {
            ctx.replyWithPhoto({ source: value }, { caption: texts.statistics(daysLeft, wordsLeft),
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

    getProjects(userId).then((rows) => {
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
        // check for invalid inputs and sql injections
        if (userInput != null) {
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
            ctx.reply(texts.setGoal);

            sessionData.waitingForWordsStart = false;
            sessionData.wordsStart = start
            sessionData.waitingForWordsGoal = true;
        } else {
            ctx.reply(errors.numberInvalid);
        }
    } else if (sessionData.waitingForWordsGoal) {
        // проверить что цель больше начала
        const goal = parseInt(userInput);
        if (!isNaN(goal)) {
            const remainingDays = getRemainingDaysInMonth()

            const {projectName, wordsStart} = sessionData
            createProject(userId, projectName, wordsStart, goal).then(id => {
                const dailyGoal = Math.ceil((goal - wordsStart) / remainingDays)
                ctx.reply(texts.projectCreated(remainingDays, dailyGoal),
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

            sessionData.waitingForWordsGoal = false;
        } else {
            ctx.reply(errors.numberInvalid);
        }
    } else if (sessionData.waitingForCurrentWords && sessionData.projectId != null) {
        const {projectId} = sessionData
        const currentWords = parseInt(userInput);
        if (!isNaN(currentWords)) {
            setResult(projectId, currentWords)

            // todo
            const wordsLeft = 50000 - currentWords

            ctx.reply(texts.todaySaved(wordsLeft), {
                reply_markup: {
                    inline_keyboard: [
                        [
                            buttons.setToday(projectId),
                            buttons.statistics(projectId),
                        ],
                    ],
                },
            });

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
    close()
    process.exit(); // Ensure the process exits
});
