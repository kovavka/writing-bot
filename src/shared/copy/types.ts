export type InlineKeyboardButton<T extends string> = {
  text: string
  callback_data: T | `${T}_${number}`
}
