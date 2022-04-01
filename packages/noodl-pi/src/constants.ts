export const WORKER_INITIATED = 'WORKER_INITIATED'
export const GET_TABLE_CONTENTS = 'GET_TABLE_CONTENTS'
export const SET_STORE_DATA = 'SET_STORE_DATA'

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
