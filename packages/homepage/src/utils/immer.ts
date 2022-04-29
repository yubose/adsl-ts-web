import produce, { current as toCurrent, isDraft } from 'immer'
import type { Draft } from 'immer'

export type { Draft }
export { produce, isDraft }

export function getCurrent<V = any>(value: V) {
  return isDraft(value) ? toCurrent(value) : value
}
