import {getWordForm} from "./utils";
import {forms} from "./forms";

export const errors = {
    unknown: `Перо знает много, но не понимает, что ведьмочка от него хочет. Используй заклинание /help`,
    nameInvalid: `Ухх! Это очень опасное заклинание. Лучше выбрать другое имя`,
    numberInvalid: `Ой, мне нужно было число, а не заклинание`,
    generic: `Ой, кажется, это заклинание прошло не очень удачно. Пожалуйста, обратись к главному магистру`,
}

export const texts = {
    help: `Ууху я - Перо, самый умный фамильяр. Буду записывать твой прогресс, ни одно слово не упущу, так и знай! Ухуу!`,
    welcome: `Ух, новая ведьмочка! Меня зовут Перо, я самый умный фамильяр. Буду записывать твой прогресс, ни одно слово не упущу, так и знай! Ухуу!\n\nА как мне называть тебя?`,
    userNameSet: `Приятно познакомиться! Теперь я могу помочь тебе создать твой первый гримуар`,
    userNameUpdated: `Приятно познакомиться!`,
    welcomeBack: (name: string) => `С возвращением, ${name}!`,
    setName: `Как будет называться твоя волшебная книга?`,
    setStart: `Угу... Хорошее имя, ведьмочка! Теперь, сколько слов у тебя уже есть?\nОбрати внимание, ведьма, СЛОВ, а не знаков. Если ещё только начинаешь своё заклинание, пиши 0`,
    setGoal: `Сколько слов ты хочешь написать за это время?`,
    projectCreated: (finalWords: number, daysLeft: number, dayGoal: number)=> `WriteUp! Время писать! Через ${daysLeft} ${getWordForm(daysLeft, forms.days)} в твоём гримуаре должно быть ${finalWords} ${getWordForm(finalWords, forms.words)}.
Твоя цель на каждый день: ${dayGoal} ${getWordForm(dayGoal, forms.words)}`,
    allProjects: `Ууху, вот все ваши гримуары`,
    zeroProjects: `Кажется, у тебя ещё нет гримуаров, но могу помочь тебе создать новый`,
    selectProject: (name: string) => `Ууху, открываю гримуар _${name}_`,
    editProject: `Конечно, что ты хочешь поменять?`,
    projectRenamed: `Хорошее имя, ведьмочка!`,
    projectRemoved: `Гримуар удалён!`,
    setToday: (words: number) => `Надеюсь, твой день прошел хорошо. В прошлый раз гримуаре было ${words} ${getWordForm(words, forms.words)}. Расскажи Перо, сколько слов в нём сейчас?`,
    todaySaved: (wordsDiff: number) => `Вот это да, какая талантливая ведьмочка мне попалась! Сегодня ты написала ${wordsDiff} ${getWordForm(wordsDiff, forms.words)}. Заклинание все крепче, у нас все получается!`,
    todaySavedNegative: (wordsDiff: number) => `Какая усердная ведьмочка мне попалась, всё редактирует и редактирует! Сегодня ты вычеркнула ${Math.abs(wordsDiff)} ${getWordForm(wordsDiff, forms.words)}.`,
    todayAchieved: `Надо же, ведьмочка, теперь твоя цель выполнена!`,
    statistics: (daysLeft: number, wordsLeft: number) => `Впереди еще ${daysLeft} ${getWordForm(daysLeft, forms.days)} и не хватает ${wordsLeft} ${getWordForm(wordsLeft, forms.words)}. Я верю в тебя, моя ведьмочка!`,
    statisticsAchieved: `Молодец, ведьмочка, ты дописала манускрипт!`,
    status: `Я здесь, ведьмочка. Ухуу!`,
    settings: `Чем я могу тебе помочь?`,
    changeName: `Разумеется, какое имя ты хочешь взять?`,
}

export const buttons = {
    newProject: { text: 'Новый гримуар 📜', callback_data: `new_project` },
    allProjects: { text: 'Гримуары 📚', callback_data: `all_projects` },
    changeName: { text: 'Изменить имя 🦄', callback_data: `change_name` },
    editProject: (projectId: number) => ({ text: 'Редактировать ✏️', callback_data: `edit_project_${projectId}` }),
    renameProject: (projectId: number) => ({ text: 'Переименовать 📝', callback_data: `rename_project_${projectId}` }),
    removeProject: (projectId: number) => ({ text: 'Удалить ❌', callback_data: `remove_project_${projectId}` }),
    setToday: (projectId: number) => ({ text: 'Записать заклинание 🖋️', callback_data: `update_project_${projectId}` }),
    statistics: (projectId: number) => ({ text: 'Узнать будушее 🔮', callback_data: `stat_project_${projectId}` }),
}
