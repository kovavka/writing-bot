import { getWordForm } from '../../shared/get-word-form'
import { forms } from '../../shared/copy/forms'
import { DATE_FORMAT_OUTPUT, TIME_FORMAT_OUTPUT } from '../../shared/variables'
import { Moment } from 'moment-timezone'
import { formatTimeToMinutes } from '../time-utils'

export const texts = {
  help: 'Мурмур! Я Мяуз, самый пунктуальный из фамильяров. Буду помогать тебе следить за временем, пока ты пишешь',
  welcome: 'Добро пожалать, ведьмочка! Я Мяуз, самый пунктуальный из фамильяров.',
  welcomeBack: (name: string): string => `С возвращением, ${name}!`,
  status: 'Мурр, я здесь, ведьмочка',
  changeName: `Какое имя ты хочешь взять?`,
  userNameUpdated: `Приятно познакомиться!`,
  admin: 'Вот список доступных команд для админа',
  setEventDateTime: 'Введи дату и время начала спринта в формате YYYY-MM-DD HH:MM',
  setEventSprintsNumber: 'Введи количество спринтов',
  setEventSprintDuration: 'Введи длительность спринта в минутах',
  eventCreated: (date: Moment): string =>
    `Событие создано. Оно начнётся ${date.format(DATE_FORMAT_OUTPUT)} в ${date.format(TIME_FORMAT_OUTPUT)} МСК`,
  adminEventOpened: 'Событие запущено',
  eventNotificationStarted: 'Отправляю оповещения 📢',
  eventStartingSoon: (minutesLeft: number, date: Moment): string =>
    `Первый спринт начнётся уже через ${minutesLeft} ${getWordForm(minutesLeft, forms.inMinutes)} (в ${date.format(TIME_FORMAT_OUTPUT)} МСК). Ты можешь присоединиться сейчас, либо в любой момент, пока идёт событие`,
  alreadyJoined: 'Ты уже присоединилась к событию, ведьмочка',
  noEvent: (welcomeText: string): string =>
    `${welcomeText}\n
Сейчас мы не проводим событие, но я обязательно напишу тебе о следующем`,
  eventIsRunning: (welcomeText: string): string =>
    `${welcomeText}\n
Сегодня мы проводим событие. Не хочешь присоединиться?`,
  setWordsStart:
    'Напиши, сколько слов у тебя уже есть. Если хочешь начать с чистого листа, пиши 0',
  rejoin: `Рад, что ты вернулась!`,
  wordsSet: `Замурчательно!`,
  joinBeforeStart: (reactionText: string, minutesLeft: number, startMoment: Moment): string =>
    `${reactionText} Спринт начнётся через ${minutesLeft} ${getWordForm(minutesLeft, forms.inMinutes)} (в ${formatTimeToMinutes(startMoment)})`,
  joinAfterStart: (reactionText: string, minutesLeft: number, endMoment: Moment): string =>
    `${reactionText} Спринт уже начался. У тебя ${minutesLeft} ${getWordForm(minutesLeft, forms.minutes)} (до ${formatTimeToMinutes(endMoment)})`,
  sprintStarted: (sprintNumber: number, minutesLeft: number, endMoment: Moment): string =>
    `Спринт #${sprintNumber} начался! У тебя ${minutesLeft} ${getWordForm(minutesLeft, forms.minutes)} (до ${formatTimeToMinutes(endMoment)})`,
  sprintFinished: (
    breakDuration: number,
    startMoment: Moment
  ): string => `Спринт закончился. Следующий спринт начнётся через ${breakDuration} ${getWordForm(breakDuration, forms.inMinutes)} (в ${formatTimeToMinutes(startMoment)}).\n
A пока скажи, сколько слов теперь в твоём гримуаре?`,
  sprintFinishedLast: `Спринт закончился. Скажи, сколько слов теперь в твоём гримуаре?`,
  sprintResult: (sprintNumber: number, data: string): string =>
    `Результат спринта #${sprintNumber}:\n${data}`,
  eventStat: (
    sprintsNumber: number,
    usersNumber: number,
    wordsTotal: number,
    data: string
  ): string =>
    `Статистика события
Спринтов проведено: ${sprintsNumber}
Участников: ${usersNumber}
Всего слов написано: ${wordsTotal}\n
${data}`,
  wordsUpdated: (wordsDiff: number): string =>
    `Отличная работа! Ты написала ${wordsDiff} ${getWordForm(wordsDiff, forms.words)}.\n
Нажми "Выйти", если пока не хочешь продолжать. Ты сможешь вернуться в любой момент, пока идёт событие`,
  wordsUpdatedLastSprint: (wordsDiff: number): string =>
    `Отличная работа! Ты написала ${wordsDiff} ${getWordForm(wordsDiff, forms.words)}.
Это был последний спринт. Мы опубликуем статистику события в канале через несколько минут`,
  eventLeft:
    'Ты больше не будешь получать уведомления о спринтах в текущем событии. Ты сможешь вернуться в любой момент, пока идёт событие',
  eventIsAlreadyFinished:
    'Прости, событие уже закончилось. Я напишу тебе, когда мы запланируем новое',
  settings: `Чем я могу тебе помочь?`,
}
