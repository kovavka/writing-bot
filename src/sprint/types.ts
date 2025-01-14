export enum MeowsTextChainType {
  CreateEvent = 'create_event',
  JoinSprint = 'join_sprint',
  SetWordsStart = 'set_words_start',
  SetWordsEnd = 'set_words_end',
}

export enum MeowsQueryActionType {
  CreateEvent = 'create_event',
  OpenEvent = 'open_event',
  Register = 'register',
  JoinEvent = 'join_event',
  SetWordsEnd = 'set_words_end',
}

export type EventStatus = 'created' | 'open' | 'started' | 'finished'
