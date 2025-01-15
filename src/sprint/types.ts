export enum MeowsTextChainType {
  CreateEvent = 'create_event',
  JoinSprint = 'join_sprint',
  SetWordsStart = 'set_words_start',
  SetSprintWords = 'set_sprint_words',
}

export enum MeowsQueryActionType {
  CreateEvent = 'create_event',
  OpenEvent = 'open_event',
  Register = 'register',
  JoinEvent = 'join_event',
}

export type EventStatus = 'created' | 'open' | 'started' | 'finished'
