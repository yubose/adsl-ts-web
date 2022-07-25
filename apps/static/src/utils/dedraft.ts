import * as u from '@jsmanifest/utils'
import { getCurrent, isDraft, toCurrent } from './immer'

export interface DedraftOptions {
  dataObject?: string
  iteratorVar?: string
  ref: any
  root: Record<string, any>
  rootKey?: string
}

/**
 * Deeply dedrafts an immerable value to its current object literal value
 *
 * @param dedraft options
 * @returns The dedrafted value
 */
function dedraft({ ref, root, rootKey }: DedraftOptions) {
  let value = ref

  if (isDraft(value)) {
    value = toCurrent(value)
  }

  if (u.isArr(value)) {
    value = value.map((val) => dedraft({ ref: val, root, rootKey }))
  }

  if (u.isObj(value)) {
    for (const [key, val] of u.entries(value)) {
      value[key] = getCurrent(val)
    }
  }

  return value
}

export default dedraft
