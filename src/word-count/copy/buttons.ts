import { PeroQueryActionType } from '../types'
import { InlineKeyboardButton } from '../../shared/copy/types'

type ButtonType = InlineKeyboardButton<PeroQueryActionType>

export const buttons = {
  newProject: <ButtonType>{
    text: 'Новый гримуар 📜',
    callback_data: PeroQueryActionType.NewProject,
  },
  allProjects: <ButtonType>{
    text: 'Гримуары 📚',
    callback_data: PeroQueryActionType.AllProjects,
  },
  changeName: <ButtonType>{
    text: 'Изменить имя 🦄',
    callback_data: PeroQueryActionType.ChangeName,
  },
  editProject: (projectId: number): ButtonType => ({
    text: 'Редактировать ✏️',
    callback_data: `${PeroQueryActionType.EditProject}_${projectId}`,
  }),
  editGoal: (projectId: number): ButtonType => ({
    text: 'Изменить цель 📈',
    callback_data: `${PeroQueryActionType.EditGoal}_${projectId}`,
  }),
  renameProject: (projectId: number): ButtonType => ({
    text: 'Переименовать 📝',
    callback_data: `${PeroQueryActionType.RenameProject}_${projectId}`,
  }),
  removeProject: (projectId: number): ButtonType => ({
    text: 'Удалить ❌',
    callback_data: `${PeroQueryActionType.RemoveProject}_${projectId}`,
  }),
  setToday: (projectId: number): ButtonType => ({
    text: 'Записать заклинание 🖋️',
    callback_data: `${PeroQueryActionType.UpdateProject}_${projectId}`,
  }),
  statistics: (projectId: number): ButtonType => ({
    text: 'Узнать будушее 🔮',
    callback_data: `${PeroQueryActionType.StatProject}_${projectId}`,
  }),
}
