export const WORKER_INITIATED = 'WORKER_INITIATED'
export const GET_TABLE_CONTENTS = 'GET_TABLE_CONTENTS'
export const SET_STORE_DATA = 'SET_STORE_DATA'
export const TABLE_CONTENTS = 'TABLE_CONTENTS'
export const TABLE_NOT_FOUND = 'TABLE_NOT_FOUND'
export const SAVE_TABLE = 'SAVE_TABLE'
export const TABLE_SAVED = 'TABLE_SAVED'
export const TABLE_DATA_STALE = 'TABLE_DATA_STALE'

export const storeEvt = {
  STORE_DATA_CLEARED: 'storeDataCleared',
  STORE_CREATED: 'storeCreated',
  FETCHED_STORE_DATA: 'storeDataFetchResponse',
  STORE_DATA_VERSION_UPDATE: 'storeDataVersionUpdate',
  STORE_EMPTY: 'storeEmpty',
  SEARCH: 'search',
  SEARCH_RESULT: 'searchResult',
  GET: 'get',
  DELETE: 'delete',
  UPDATE: 'update',
} as const
