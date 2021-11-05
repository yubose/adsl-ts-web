export const id = `aitmed-noodl-web`
export const CACHED_PAGES = 'CACHED_PAGES'
export const PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT =
  'VideoChat.listData.participants'

/* -------------------------------------------------------
  ---- Worker
-------------------------------------------------------- */

export const command = {
  CACHE_GET: 'CACHE_GET',
  CACHE_NOODL_OBJECT: 'CACHE_NOODL_OBJECT',
  FETCH: 'FETCH',
} as const

export const responseType = {
  JSON: 'application/json',
  TEXT: 'text/plain',
} as const
