import { getWordForm } from '../../shared/get-word-form'
import { forms } from '../../shared/copy/forms'

export const texts = {
  help: 'Мурмур! Я Мяуз, самый пунктуальный из фамильяров. Буду помогать тебе следить за временем, пока ты пишешь',
  welcome:
    'Добро пожалать, ведьмочка! Я Мяуз, самый пунктуальный из фамильяров. Буду помогать тебе следить за временем, пока ты пишешь. \n\nА как мне называть тебя?',
  status: 'Мурр, я здесь, ведьмочка',
  admin: 'Вот список доступных команд для админа',
  setEventDate: 'Введи дату начала спринта в формате YYYY-MM-DD',
  setEventTime: 'Введи время начала спринта в формате TT:HH',
  setEventSprintsNumber: 'Введи количество спринтов',
  setEventSprintDuration: 'Введи длительность спринта в минутах',
  eventCreated: (date: string, time: string): string =>
    `Событие начнётся ${date} в ${time} мск`,
  eventOpened: 'Событие открыто. Пользователи получили уведомление',
  eventNotificationStarted: 'Отправляю оповещения 📢',
  register: 'register',
  wordsSet: 'wordsSet',
  wordsUpdated: (wordsDiff: number): string =>
    `Отличная работа! Ты написала ${wordsDiff} ${getWordForm(wordsDiff, forms.words)}`,
}
