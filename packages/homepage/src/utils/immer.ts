import produce, {
  createDraft,
  current as toCurrent,
  finishDraft,
  isDraft,
  produceWithPatches,
} from 'immer'
import type { Draft } from 'immer'

export type { Draft }
export {
  createDraft,
  finishDraft,
  isDraft,
  toCurrent,
  produce,
  produceWithPatches,
}

export function getCurrent<V = any>(value: V) {
  return isDraft(value) ? toCurrent(value) : value
}
