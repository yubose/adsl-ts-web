import type IDB from 'idb'
import type _JSBI from 'jsbi/jsbi'

declare global {
  // @ts-expect-error
  export const idb: typeof IDB
  // @ts-expect-error
  export const JSBI: typeof _JSBI
}
