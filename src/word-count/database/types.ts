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

export type ProjectCurrentWords = {
  id: number
  name: string
  wordsStart: number
  wordsGoal: number
  latestDate: string
  latestWords: number
}

export type TodayStatData = {
  userId: number
  userName: string
  todayDate: string
  todayWords: number
  lastResultDate: string | null
  lastResultWords: number | null
  projectName: string
  wordsStart: number
}

export type FullStatData = {
  userId: number
  userName: string
  projectId: number
  projectName: string
  dateStart: string
  dateEnd: string
  wordsStart: number
  wordsGoal: number
  latestDate: string
  latestWords: number
}
