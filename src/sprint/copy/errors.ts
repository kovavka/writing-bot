import { ErrorMessage } from '../../shared/copy/types'

export const errors: ErrorMessage = {
  unknownCommand: 'Мяуз не совсем понимает. Используй заклинание /help',
  stringInvalid: 'Это очень опасное заклинание. Попробуй другое имя',
  numberInvalid: 'Прости, мне нужно было число, а не заклинание',
  dateInvalid: 'Дата должна быть в формате YYYY-MM-DD. Например "2025-01-12"',
  generic:
    'Похоже, это заклинание прошло не очень удачно. Пожалуйста, обратись к главному магистру',
}
