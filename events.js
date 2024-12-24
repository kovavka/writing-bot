// const TelegramBot = require('node-telegram-bot-api');
const { Telegraf } = require('telegraf');
require('dotenv').config();

const commands = require('./commands')

const {
    addUser,
    createEvent,
    createSprint,
    joinSprint,
    close
} = require('./data-base')

const { TELEGRAM_BOT_TOKEN, ADMIN_ID } = process.env

// Create a bot instance
// const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

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

bot.start((ctx) => {
    const {id: userId, first_name, last_name} = ctx.from
    addUser(userId, `${first_name} ${last_name}`)
    ctx.reply(`Добро пожаловать!`);
    // const chatId = ctx.chat.id;
});

bot.command('createEvent', (ctx) => {
    if (isAdmin(ctx)) {
        createEvent(2, 25).then(id => {
            ctx.reply(`Событие создано: ${id}`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Запустить', callback_data: `run_event_${id}` },
                        ],
                    ],
                },
            });
        }).catch(err => {
            ctx.reply(err);
        })
    }
});

// const myChatId =


// Выберите "Участвовать", если начинаете с чистого листа.
//     Выберите "Продолжить", если уже работаете над текстом, вы сможете ввести свой текущий объем слов дальше.

function startEvent(ctx, eventId) {
    if (isAdmin(ctx)) {
        createSprint(eventId).then(id => {
            ctx.reply(`Событие запущено: ${eventId}. Спринт создан: ${id}`);

            setTimeout(() => {
                bot.telegram.sendMessage(ADMIN_ID, `Присоединяйтесь к спринту!
Введите текущий объём слов с помощью команты \`/join\`.
Например \`/join 2000\`, чтобы присединиться с начальными 2000 слов или просто \`/join\`, чтобы начать с чистого листа.`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                // [
                                //     { text: 'Участвовать', callback_data: `join_sprint_0` },
                                //     { text: 'Продолжить', callback_data: `join_sprint_custom` },
                                // ],
                            ],
                        },
                    } )
                    .catch((error) => {
                        console.error(`Failed to send message to chat ${ADMIN_ID}: ${error.message}`);
                    });
            }, 1000)

            setTimeout(() => {
                // todo check if joined
                bot.telegram.sendMessage(ADMIN_ID, `Спринт закончился. У вас будет 5 минут, чтобы ввести свой результат.
Введите новый объём слов с помощью команты \`/words\`.
Например \`/words 2500\`, чтобы обновить объём слов до 2500.

Следующий спринт начнётся сразу после окончания таймера.`,
                    {
                        parse_mode: 'Markdown',
                        // reply_markup: {
                        //     inline_keyboard: [
                        //         [
                        //             { text: 'Пропустить', callback_data: `sprint_result_0` },
                        //         ],
                        //     ],
                        // },
                    } )
                    .catch((error) => {
                        console.error(`Failed to send message to chat ${ADMIN_ID}: ${error.message}`);
                    });
            }, 1000*10)

            setTimeout(() => {
                bot.telegram.sendMessage(ADMIN_ID, `Результат спринта:

1. Лев Толстой: 5000
2. Антон Чехов: 2000
3. Gin Kapger: 500

Новый спринт продолжится до 13:30 (25 минут).
Следующий перерыв: 15:00 (через 1 час 30 минут).

Нажмите "Закончить", если пока не будете продолжать. Вы всегда можете присоединиться позже.`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: 'Закончить', callback_data: `exit_event` },
                                ],
                            ],
                        },
                    } )
                    .catch((error) => {
                        console.error(`Failed to send message to chat ${ADMIN_ID}: ${error.message}`);
                    });
            }, 1000*30)


        }).catch(err => {
            ctx.reply(err);
        })
    }
}

bot.command('startEvent', (ctx) => {
    const messageText = ctx.message.text;
    const [, eventId] = messageText.split(' ');
    if (eventId != null) {
        startEvent(ctx, eventId)
    } else {
        ctx.reply("Ожидается eventId");
    }
});

bot.command('join', (ctx) => {
    const messageText = ctx.message.text;
    const [, wordCount = 0] = messageText.split(' ');
    ctx.reply(`Вы присоединились к спринту. Начальное количество слов: ${wordCount}`)
    // add to db
});


bot.command('words', (ctx) => {
    const messageText = ctx.message.text;
    const [, wordCount = 0] = messageText.split(' ');
    ctx.reply(`Результат записан. Добавлено слов: ${wordCount - 2000}`)
    // add to db
});

bot.on('callback_query', (ctx) => {
    const callbackData = ctx.callbackQuery.data;

    if (callbackData.startsWith('run_event')) {
        const [,,eventId] = callbackData.split('_');
        startEvent(ctx, eventId)
    // } else if (callbackData.startsWith('join_sprint')) {
    //     const [,,commandType] = callbackData.split('_');
    //     const wordCount = commandType === 'custom' ? 2000 : 0
    //     ctx.reply(`Вы присоединились к спринту. Начальное количество слов: ${wordCount}`)
    //     // add to db
    // } else if (callbackData.startsWith('sprint_result')) {
    //     const [,,commandType] = callbackData.split('_');
    //     ctx.reply(`Вы написали 0 слов за этот спринт`)
    //     // add to db
    } else if (callbackData.startsWith('exit_event')) {
        ctx.reply(`Вы больше не будете получать уведомления о спринтах в текущем событии.
Если захотите снова присоединиться к спринту, нажмите "Вернуться".`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Вернуться', callback_data: `join_sprint` },
                    ],
                ],
            },
        })
        // add to db
    } else {
        ctx.reply('Неизвестная команда!');
    }

    // Answer the callback query (prevents loading icon)
    ctx.answerCbQuery();
});

bot.launch();

// bot.on('message', async (msg) => {
//     const chatId = msg.chat.id;
//     const text = msg.text;
//
//     const {id: userId, first_name, last_name} = msg.from
//
//     // todo fix
//     const id = userId
//
//
//     if (text === '/createEvent') {
//         runIfAdmin(userId, chatId, () => createEvent(2, 25), "Событие создано")
//     } else if (text === '/startEvent') {
//
//     } else if (text === '/join') {
//         if (marathon.status === 'off') {
//             bot.sendMessage(chatId, `На данный момент марафон не запущен`);
//         } else {
//             marathon.participants[id] = `${first_name} ${last_name}`
//             bot.sendMessage(chatId, `${first_name} ${last_name} участвует в марафоне`);
//         }
//     } else if (text === '/participants') {
//        bot.sendMessage(chatId, Object.values(marathon.participants).join(', '));
//     } else if (text.startsWith('/update')) {
//        const [, wordsCount] = text.split(' ')
//
//        if (wordsCount !== undefined) {
//            const oldCount = marathon.words[id] ?? 0
//            marathon.words[id] = wordsCount
//
//
//            bot.sendMessage(chatId, `Количество слов обновлено: ${wordsCount} (+${wordsCount - oldCount})`);
//        }
//     } else if (text.startsWith('/today')) {
//        const ids = Object.keys(marathon.participants)
//
//
//         const list = ids.map(id => {
//             const name = marathon.participants[id]
//             const words = marathon.words[id]
//             return {name, words}
//         })
//
//         // result.sort()
//
//         const result = list.map(({name, words}) => `${name}: ${words}`)
//
//         bot.sendMessage(chatId, `Результаты за сегодня:\n\n${result.join('\n')}`);
//     } else if (text === '/progress') {
//         // marathon.progress
//
//
//         bot.sendPhoto(chatId, './word-count-chart.png', {
//             caption: 'Ваш прогресс',
//         });
//
//
//     }
//
// });


console.log('Bot is running...');


process.on('SIGINT', () => {
    close()
    process.exit(); // Ensure the process exits
});

// console.log(commands.startMarathon())