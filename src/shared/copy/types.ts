export type InlineKeyboardButton<T extends string> = {
  text: string
  callback_data: T | `${T}_${number}`
}

export type ErrorMessage = {
  unknownCommand: string
  stringInvalid: string
  numberInvalid: string
  generic: string
}
