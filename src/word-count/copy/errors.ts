import { ErrorMessage } from '../../shared/copy/types'
import { DATE_FORMAT_INPUT } from '../../shared/variables'

export const errors: ErrorMessage = {
  unknownCommand: `Перо знает много, но не понимает, что ведьмочка от него хочет. Используй заклинание /help`,
  stringInvalid: `Ухх! Это очень опасное заклинание. Лучше выбрать другое имя`,
  numberInvalid: `Ой, мне нужно было число, а не заклинание`,
  dateInvalid: `Дата должна быть в формате ${DATE_FORMAT_INPUT}. Например "19.01.25"`,
  datePast: `Этот день уже наступил. Пожалуйста, укажи другую дату`,
  generic: `Ой, кажется, это заклинание прошло не очень удачно. Пожалуйста, обратись к главному магистру`,
}
