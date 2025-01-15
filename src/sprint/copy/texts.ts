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
  registrationOpened: (date: Moment): string =>
    `Событие начнётся ${date.format(DATE_FORMAT_OUTPUT)} в ${date.format(TIME_FORMAT_OUTPUT)} МСК`,

  eventOpened: 'Событие открыто. Пользователи получили уведомление',
  eventNotificationStarted: 'Отправляю оповещения 📢',
  registered:
    'Ты зарегистрировалась на событие. Я напишу тебе ещё раз за 5 минут до начала ‍⏰',
  eventStarted:
    'Первый спринт начнётся уже через 5 минут. Ты можешь присоединиться сейчас, либо в любой мемент, пока идёт событие',
  setWordsStart: 'Напиши, сколько слов у тебя уже есть. Если хочешь сама считать итог, пиши 0',
  wordsSet: 'Отлично! Можешь начинать',
  sprintStarted: (minutes: number): string =>
    `Спринт начался! У тебя ${minutes} ${getWordForm(minutes, forms.minutes)}. Не отвлекайся!`,
  sprintFinished:
    'Спринт закончился. Следующий спринт начнётся через 5 минут. А пока скажи, сколько слов теперь в твоём гримуаре?',
  wordsUpdated: (wordsDiff: number): string =>
    `Отличная работа! Ты написала ${wordsDiff} ${getWordForm(wordsDiff, forms.words)}`,
  sprintResult: (data: string): string => `Результат спринта:
${data}

Новый спринт продолжится до X (25 минут).
Следующий перерыв: Y (через A час B минут).

Нажми "Закончить", если пока не хочешь продолжать. Ты сможешь вернуться в любой мемент, пока идёт событие`,
  eventIsAlreadyFinished: 'eventIsAlreadyFinished',
}
