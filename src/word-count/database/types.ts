export type User = {
  id: number
  name: string
}

export type Project = {
  id: number
  userId: number
  name: string
  dateStart: string
  dateEnd: string
  wordsStart: number
  wordsGoal: number
  hidden: number
  hiddenDate: number
}

export type DayResult = {
  id: number
  projectId: number
  date: string
  words: number
}
