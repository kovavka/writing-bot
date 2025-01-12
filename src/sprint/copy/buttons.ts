import { MeowsQueryActionType } from '../types'
import { InlineKeyboardButton } from '../../shared/copy/types'

type ButtonType = InlineKeyboardButton<MeowsQueryActionType>

export const buttons = {
  register: <ButtonType>{
    text: 'Записаться',
    callback_data: MeowsQueryActionType.NewProject,
  },
}
