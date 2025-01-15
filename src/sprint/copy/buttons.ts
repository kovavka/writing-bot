import { MeowsQueryActionType } from '../types'
import { InlineKeyboardButton } from '../../shared/copy/types'

type ButtonType = InlineKeyboardButton<MeowsQueryActionType>

export const buttons = {
  createEvent: <ButtonType>{
    text: 'Создать событие',
    callback_data: MeowsQueryActionType.CreateEvent,
  },
  openEvent: (eventId: number): ButtonType => ({
    text: 'Открыть регистрацию',
    callback_data: `${MeowsQueryActionType.OpenEvent}_${eventId}`,
  }),
  register: (eventId: number): ButtonType => ({
    text: 'Участвовать',
    callback_data: `${MeowsQueryActionType.Register}_${eventId}`,
  }),
  joinEvent: (eventId: number): ButtonType => ({
    text: 'Присоединиться',
    callback_data: `${MeowsQueryActionType.JoinEvent}_${eventId}`,
  }),
}
