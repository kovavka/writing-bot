import { getWordForm } from '../../shared/get-word-form'
import { forms } from '../../shared/copy/forms'
import { DATE_FORMAT_OUTPUT, TIME_FORMAT_OUTPUT } from '../../shared/variables'
import { Moment } from 'moment-timezone'

// todo add number of sprints in the notification
export const texts = {
  help: 'Мурмур! Я Мяуз, самый пунктуальный из фамильяров. Буду помогать тебе следить за временем, пока ты пишешь',
  welcome:
    'Добро пожалать, ведьмочка! Я Мяуз, самый пунктуальный из фамильяров. Буду помогать тебе следить за временем, пока ты пишешь',
  welcomeBack: (name: string): string => `С возвращением, ${name}!`,
  status: 'Мурр, я здесь, ведьмочка',
  admin: 'Вот список доступных команд для админа',
  setEventDateTime: 'Введи дату и время начала спринта в формате YYYY-MM-DD HH:MM',
  setEventSprintsNumber: 'Введи количество спринтов',
  setEventSprintDuration: 'Введи длительность спринта в минутах',
  eventCreated: (date: Moment): string =>
    `Событие создано. Оно начнётся ${date.format(DATE_FORMAT_OUTPUT)} в ${date.format(TIME_FORMAT_OUTPUT)} МСК`,
  adminEventOpened: 'Событие запущено',
  eventNotificationStarted: 'Отправляю оповещения 📢',
  eventStartingSoon: (minutesLeft: number, startTime: string): string =>
    `Первый спринт начнётся уже через ${minutesLeft} ${getWordForm(minutesLeft, forms.inMinutes)} (в ${startTime} МСК). Ты можешь присоединиться сейчас, либо в любой мемент, пока идёт событие`,
  alreadyJoined: 'Ты уже присоединилась к событию, ведьмочка',
  setWordsStart:
    'Напиши, сколько слов у тебя уже есть. Если хочешь начать с чистого листа, пиши 0',
  wordsSetBeforeStart: (minutesLeft: number): string =>
    `Замурчательно! Спринт начнётся через ${minutesLeft} ${getWordForm(minutesLeft, forms.inMinutes)}`,
  wordsSetAfterStart: (minutesLeft: number): string =>
    `Замурчательно! Спринт уже начался. У тебя ${minutesLeft} ${getWordForm(minutesLeft, forms.minutes)}`,
  sprintStarted: (sprintNumber: number, minutesLeft: number, endTime: string): string =>
    `Спринт #${sprintNumber} начался! У тебя ${minutesLeft} ${getWordForm(minutesLeft, forms.minutes)} (до ${endTime} МСК)`,
  sprintFinished: `Спринт закончился. Скажи, сколько слов теперь в твоём гримуаре?`,
  wordsUpdated: (wordsDiff: number, breakDuration: number, startTime: string): string =>
    `Отличная работа! Ты написала ${wordsDiff} ${getWordForm(wordsDiff, forms.words)}
Следующий спринт начнётся через ${breakDuration} ${getWordForm(breakDuration, forms.inMinutes)} (в ${startTime} МСК).\n
Нажми "Выйти", если пока не хочешь продолжать. Ты сможешь вернуться в любой мемент, пока идёт событие`,
  wordsUpdatedLastSprint: (wordsDiff: number): string =>
    `Отличная работа! Ты написала ${wordsDiff} ${getWordForm(wordsDiff, forms.words)}.
Это был последний спринт. Мы опубликуем рельтаты в канале через несколько минут`,
  eventLeft:
    'Ты больше не будете получать уведомления о спринтах в текущем событии. Ты сможешь вернуться в любой мемент, пока идёт событие',
  eventIsAlreadyFinished:
    'Прости, событие уже закончилось. Я напишу тебе, когда мы запланируем новое',
}
