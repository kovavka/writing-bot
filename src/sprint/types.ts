export enum MeowsTextChainType {
  CreateEvent = 'create_event',
  SetWordsStart = 'update_words_start',
}

export enum MeowsQueryActionType {
  CreateEvent = 'create_event',
  OpenEvent = 'open_event',
  Register = 'register',
  JoinEvent = 'join_event',
}

export type EventStatus = 'created' | 'open' | 'started' | 'finished'
