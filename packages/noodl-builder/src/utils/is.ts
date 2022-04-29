import type { ReferenceString } from 'noodl-types'
import type NoodlBase from '../Base'
import type NoodlValue from '../Value'
import type NoodlString from '../String'
import type NoodlArray from '../Array'
import type NoodlObject from '../Object'
import type NoodlProperty from '../Property'
import { nkey } from '../constants'

const hasOwnProp = Object.prototype.hasOwnProperty
// const nkeys = Object.values(nkey)

function isSameNodeType<V>(type: string, v: unknown): v is V
function isSameNodeType<V>(type: string): (v: unknown) => v is V
function isSameNodeType<V>(type: string, v1?: unknown) {
  if (v1) {
    return !!(v1 && typeof v1 === 'object') && v1['__ntype'] === type
  }
  return (v: unknown): v is V =>
    !!(v && typeof v === 'object') && v['__ntype'] === type
}

const is = {
  node: (v: unknown): v is NoodlBase =>
    !!(v && typeof v === 'object') &&
    ['__key', '__nkey'].some((key) => hasOwnProp.call(v, key)),
  baseNode: isSameNodeType<NoodlBase>(nkey.base),
  valueNode: isSameNodeType<NoodlValue<any>>(nkey.value),
  stringNode: isSameNodeType<NoodlString>(nkey.string),
  propertyNode: isSameNodeType<NoodlProperty<any>>(nkey.property),
  arrayNode: isSameNodeType<NoodlArray>(nkey.array),
  objectNode: isSameNodeType<NoodlObject>(nkey.object),
  reference: (v: unknown): v is ReferenceString => {
    v = (is.stringNode(v) ? v.getValue() : v) as string
    if (typeof v === 'string') {
      if (v.startsWith('.')) return true
      if (v.endsWith('@')) return true
      if (v.startsWith('=.')) return true
      if (v.startsWith('~/')) return true
      if (/[_]+./.test(v)) return true
    }
    return false
  },
  sameNodeType: isSameNodeType,
}

export default is
