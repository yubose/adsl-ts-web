import * as u from '@jsmanifest/utils'
import { Identify } from 'noodl-types'

export function componentByReference(value: unknown) {
  if (u.isObj(value)) {
    const keys = u.keys(value)
    return keys.length === 1 && keys.some((key) => Identify.reference(key))
  }
  return false
}

export default {
  ...Identify,
  componentByReference,
}
