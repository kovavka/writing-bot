import { MeowsQueryActionType } from '../types'
import { InlineKeyboardButton } from '../../shared/copy/types'

type ButtonType = InlineKeyboardButton<MeowsQueryActionType>

export const buttons = {
  createEvent: <ButtonType>{
    text: 'Создать событие',
    callback_data: MeowsQueryActionType.CreateEvent,
  },
  openEvent: (eventId: number): ButtonType => ({
    text: 'Оповестить',
    callback_data: `${MeowsQueryActionType.OpenEvent}_${eventId}`,
  }),
  eventStat: (eventId: number): ButtonType => ({
    text: 'Статистика',
    callback_data: `${MeowsQueryActionType.EventStat}_${eventId}`,
  }),
  startLatestSprint: (eventId: number): ButtonType => ({
    text: 'Запустить спринт',
    callback_data: `${MeowsQueryActionType.StartLatestSprint}_${eventId}`,
  }),
  finishEvent: (eventId: number): ButtonType => ({
    text: 'Завершить',
    callback_data: `${MeowsQueryActionType.FinishEvent}_${eventId}`,
  }),
  eventSchedule: (eventId: number): ButtonType => ({
    text: 'Расписание',
    callback_data: `${MeowsQueryActionType.EventSchedule}_${eventId}`,
  }),
  joinEvent: (eventId: number): ButtonType => ({
    text: 'Присоединиться',
    callback_data: `${MeowsQueryActionType.JoinEvent}_${eventId}`,
  }),
  leaveEvent: (eventId: number): ButtonType => ({
    text: 'Выйти',
    callback_data: `${MeowsQueryActionType.LeaveEvent}_${eventId}`,
  }),
  rejoinEvent: (eventId: number): ButtonType => ({
    text: 'Вернуться',
    callback_data: `${MeowsQueryActionType.RejoinEvent}_${eventId}`,
  }),
  changeName: <ButtonType>{
    text: 'Изменить имя',
    callback_data: MeowsQueryActionType.ChangeName,
  },
}
