import { ErrorMessage } from '../../shared/copy/types'
import { DATE_FORMAT_INPUT } from '../../shared/variables'

export const errors: ErrorMessage = {
  unknownCommand: 'Мяуз не совсем понимает. Используй заклинание /help',
  stringInvalid: 'Это очень опасное заклинание. Попробуй другое имя',
  numberInvalid: 'Прости, мне нужно было число, а не заклинание',
  dateInvalid: `Дата должна быть в формате ${DATE_FORMAT_INPUT}. Например "19.01.25"`,
  datePast: `Этот день уже наступил. Пожалуйста, укажи другую дату`,
  generic:
    'Похоже, это заклинание прошло не очень удачно. Пожалуйста, обратись к главному магистру',
}
