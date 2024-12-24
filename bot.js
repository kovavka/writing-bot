// const TelegramBot = require('node-telegram-bot-api');
const { Telegraf, session } = require('telegraf');
require('dotenv').config();

const {getChart} = require('./chart')
const commands = require('./commands')

const {
    addUser,
    createProject,
    getStatistics,
    setResult,
    close
} = require('./data-base')

const { TELEGRAM_BOT_TOKEN, ADMIN_ID } = process.env

// Create a bot instance
// const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
bot.use(session());

// todo add try catch everywhere

const marathon = {
    status: 'off',
    participants: {
        0: 'Лев Толстой', 1: 'Антон Чехов',

    },
    words: {
        0: 5000,
        1: 2000,
    },
    progress: [
        1000,
        1200,
        2000,
        2000,
        3500,
        6000,
        60001
    ]
}

function isAdmin(ctx) {
    const {id: userId} = ctx.from
    const ifAdmin = userId.toString() === ADMIN_ID

    if (!ifAdmin) {
        ctx.reply(`Неизвестная команда`);
    }

    return ifAdmin
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
    ctx.reply(`Добро пожаловать!`, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Создать новый проект', callback_data: `new_project` },
                ],
            ],
        },
    });
});

bot.command('words', (ctx) => {
    const messageText = ctx.message.text;
    const [, wordCount = 0] = messageText.split(' ');
    ctx.reply(`Результат записан. Добавлено слов: ${wordCount - 2000}`)
    // add to db
});

bot.on('callback_query', (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    const {id: userId} = ctx.from

    initSession(ctx)
    if (callbackData.startsWith('new_project')) {
        ctx.session[userId] = { waitingForProjectName: true };

        ctx.reply('Введите имя проекта');
        ctx.answerCbQuery();
    } else if (callbackData.startsWith('update_project_')) {
        const [,,projectId] = callbackData.split('_');

        ctx.session[userId] = {
            waitingForCurrentWords: true,
            projectId,
        };

        ctx.reply('Введите текущий объём в словах');
        ctx.answerCbQuery();
    } else if (callbackData.startsWith('stat_project_')) {
        const [,,projectId] = callbackData.split('_');

        // const today = new Date();
        const lastDay = 31


        getStatistics(projectId).then(rows => {
            const result = []
            console.log(rows)

            // const rowsObj = rows.map(x=>x.day)

            // todo start with actual words start
            let prevRes = 0
            for(let i = 0; i < lastDay; i++) {
                if (rows.day === i + 1) {
                    result[i] = rows.result
                    prevRes = rows.result
                } else {
                    result[i] = prevRes
                }
            }

            console.log(result)
            ctx.answerCbQuery();

            // getChart().then((value) => {
            //     ctx.replyWithPhoto({ source: value }, { caption: 'Ваша статистика',
            //         reply_markup: {
            //             inline_keyboard: [
            //                 [
            //                     { text: 'Ввести результат', callback_data: `update_project_${projectId}` },
            //                 ],
            //             ],
            //         }, });
            //
            //     ctx.answerCbQuery();
            // }).catch(() => {
            //     ctx.reply('Ошибка при создании статистики');
            //
            //     ctx.answerCbQuery();
            // })
        }).catch(() => {
            ctx.reply('Ошибка при создании статистики');

            ctx.answerCbQuery();
        })
    } else {
        ctx.reply('Неизвестная команда!');
        ctx.answerCbQuery();
    }
});

bot.on('text', (ctx) => {
    const {id: userId} = ctx.from
    const userInput = ctx.message.text;

    initSession(ctx)

    const sessionData = ctx.session[userId]

    if (sessionData == null) {
        ctx.reply('Текст не распознан. Используйте команду \\help, чтобы узнать о доступных командах');
        return
    }

    if (sessionData.waitingForProjectName) {
        // check for invalid inputs and sql injections
        if (userInput != null) {
            ctx.reply(`Введите количество слов, с котором вы начинаете. Если вы начинаете с чистого листа, введите 0`);

            sessionData.waitingForProjectName = false;
            sessionData.projectName = userInput
            sessionData.waitingForWordsStart = true;
        } else {
            ctx.reply('That is not a valid name. Please send a valid name.');
        }
    } else if (sessionData.waitingForWordsStart) {
        const start = parseInt(userInput);
        if (!isNaN(start)) {
            ctx.reply(`Введите количество слов, которое вы хотите написать в этом месяце`);

            sessionData.waitingForWordsStart = false;
            sessionData.wordsStart = start
            sessionData.waitingForWordsGoal = true;
        } else {
            ctx.reply('That is not a valid number. Please send a valid number.');
        }
    } else if (sessionData.waitingForWordsGoal) {
        // проверить что цель больше начала
        const goal = parseInt(userInput);
        if (!isNaN(goal)) {
            const remainingDays = getRemainingDaysInMonth()

            const {projectName, wordsStart} = sessionData
            createProject(userId, projectName, wordsStart, goal).then(id => {
                ctx.reply(`Проект ${projectName} создан! Ваша цель на каждый день – ${Math.ceil((goal - wordsStart) / remainingDays)} слов`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: 'Ввести результат', callback_data: `update_project_${id}` },
                                    { text: 'Статистика', callback_data: `stat_project_${id}` },
                                ],
                            ],
                        },
                    });
            }).catch(err => {
                ctx.reply(err);
            })

            sessionData.waitingForWordsGoal = false;
        } else {
            ctx.reply('That is not a valid number. Please send a valid number.');
        }
    } else if (sessionData.waitingForCurrentWords && sessionData.projectId != null) {
        const {projectId} = sessionData
        const currentWords = parseInt(userInput);
        if (!isNaN(currentWords)) {
            setResult(projectId, currentWords)

            ctx.reply(`Результат сохранён. +244 слова. Сегодняшняя цель выполнена на N%`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Ввести результат', callback_data: `update_project_${projectId}` },
                            { text: 'Статистика', callback_data: `stat_project_${projectId}` },
                        ],
                    ],
                },
            });

            sessionData.waitingForCurrentWords = false;
        } else {
            ctx.reply('That is not a valid number. Please send a valid number.');
        }
    } else {
        ctx.reply('Текст не распознан. Используте команду \\help, чтобы узнать о доступных командах');

    }

});


bot.launch();

console.log('Bot is running...');

process.on('SIGINT', () => {
    close()
    process.exit(); // Ensure the process exits
});
