export enum MeowsTextChainType {
  CreateEvent = 'create_event',
  SetWordsStart = 'set_words_start',
}

export enum MeowsQueryActionType {
  CreateEvent = 'create_event',
  OpenEvent = 'open_event',
  JoinEvent = 'join_event',
  LeaveEvent = 'leave_event',
  RejoinEvent = 'rejoin_event',
}

export type EventStatus = 'created' | 'open' | 'started' | 'finished'
