import { getWordForm } from '../../shared/get-word-form'
import { forms } from '../../shared/copy/forms'
import { DATE_FORMAT_INPUT } from '../../shared/variables'

export const texts = {
  help: `Ууху я - Перо, самый умный фамильяр. Буду записывать твой прогресс, ни одно слово не упущу, так и знай! Ухуу!`,
  welcome: `Ух, новая ведьмочка! Меня зовут Перо, я самый умный фамильяр. Буду записывать твой прогресс, ни одно слово не упущу, так и знай! Ухуу!\n\nА как мне называть тебя?`,
  userNameSet: `Приятно познакомиться! Теперь я могу помочь тебе создать твой первый гримуар`,
  userNameUpdated: `Приятно познакомиться!`,
  welcomeBack: (name: string): string => `С возвращением, ${name}!`,
  setName: `Как будет называться твоя волшебная книга?`,
  setStart: `Угу... Хорошее имя, ведьмочка! Теперь, сколько слов у тебя уже есть?\nОбрати внимание, ведьма, СЛОВ, а не знаков. Если ещё только начинаешь своё заклинание, пиши 0`,
  setDeadline: `Когда ты хочешь закончить рукопись?\nВведи дату в формате \`${DATE_FORMAT_INPUT}\``,
  setGoal: `Сколько слов ты хочешь написать за это время?`,
  projectCreated: (
    finalWords: number,
    daysLeft: number,
    dayGoal: number
  ): string => `Время писать! Через ${daysLeft} ${getWordForm(daysLeft, forms.days)} в твоём гримуаре должно быть ${finalWords} ${getWordForm(finalWords, forms.words)}.
Твоя цель на каждый день: ${dayGoal} ${getWordForm(dayGoal, forms.words)}`,
  allProjects: `Ууху, вот все ваши гримуары`,
  zeroProjects: `Кажется, у тебя ещё нет гримуаров, но могу помочь тебе создать новый`,
  selectProject: (name: string): string => `Ууху, открываю гримуар _${name}_`,
  editProject: `Конечно, что ты хочешь поменять?`,
  editGoal: `Конечно, слов ты хочешь написать в итоге?`,
  goalUpdated: (finalWords: number, daysLeft: number, dayGoal: number): string =>
    `Через ${daysLeft} ${getWordForm(daysLeft, forms.days)} в твоём гримуаре должно быть ${finalWords} ${getWordForm(finalWords, forms.words)}. Твоя новая цель на каждый день: ${dayGoal} ${getWordForm(dayGoal, forms.words)}`,
  projectRenamed: `Хорошее имя, ведьмочка!`,
  projectRemoved: `Гримуар удалён!`,
  setToday: (words: number): string =>
    `Надеюсь, твой день прошел хорошо. В прошлый раз гримуаре было ${words} ${getWordForm(words, forms.words)}. Расскажи Перо, сколько слов в нём сейчас?`,
  todaySaved: (wordsDiff: number): string =>
    `Вот это да, какая талантливая ведьмочка мне попалась! Сегодня ты написала ${wordsDiff} ${getWordForm(wordsDiff, forms.words)}. Заклинание все крепче, у нас все получается!`,
  todaySavedNegative: (wordsDiff: number): string =>
    `Какая усердная ведьмочка, всё редактирует и редактирует! Сегодня ты *удалила* ${Math.abs(wordsDiff)} ${getWordForm(wordsDiff, forms.words)}.`,
  todayAchieved: `Надо же, ведьмочка, теперь твоя цель выполнена!`,
  statistics: (daysLeft: number, wordsLeft: number): string =>
    `Впереди еще ${daysLeft} ${getWordForm(daysLeft, forms.days)} и не хватает ${wordsLeft} ${getWordForm(wordsLeft, forms.words)}. Я верю в тебя, моя ведьмочка!`,
  statisticsAchieved: `Молодец, ведьмочка, ты дописала манускрипт!`,
  status: `Я здесь, ведьмочка. Ухуу!`,
  settings: `Чем я могу тебе помочь?`,
  changeName: `Разумеется, какое имя ты хочешь взять?`,
}
