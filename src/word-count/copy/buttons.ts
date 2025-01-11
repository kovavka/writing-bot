import { QueryType } from '../types'
import { InlineKeyboardButton } from '../../shared/copy/types'

type ButtonType = InlineKeyboardButton<QueryType>

export const buttons = {
  newProject: <ButtonType>{
    text: 'Новый гримуар 📜',
    callback_data: QueryType.NewProject,
  },
  allProjects: <ButtonType>{
    text: 'Гримуары 📚',
    callback_data: QueryType.AllProjects,
  },
  changeName: <ButtonType>{
    text: 'Изменить имя 🦄',
    callback_data: QueryType.ChangeName,
  },
  editProject: (projectId: number): ButtonType => ({
    text: 'Редактировать ✏️',
    callback_data: `${QueryType.EditProject}_${projectId}`,
  }),
  editGoal: (projectId: number): ButtonType => ({
    text: 'Изменить цель 📈',
    callback_data: `${QueryType.EditGoal}_${projectId}`,
  }),
  renameProject: (projectId: number): ButtonType => ({
    text: 'Переименовать 📝',
    callback_data: `${QueryType.RenameProject}_${projectId}`,
  }),
  removeProject: (projectId: number): ButtonType => ({
    text: 'Удалить ❌',
    callback_data: `${QueryType.RemoveProject}_${projectId}`,
  }),
  setToday: (projectId: number): ButtonType => ({
    text: 'Записать заклинание 🖋️',
    callback_data: `${QueryType.UpdateProject}_${projectId}`,
  }),
  statistics: (projectId: number): ButtonType => ({
    text: 'Узнать будушее 🔮',
    callback_data: `${QueryType.StatProject}_${projectId}`,
  }),
}
