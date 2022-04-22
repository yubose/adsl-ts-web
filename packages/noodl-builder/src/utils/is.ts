import type { ReferenceString } from 'noodl-types'
import type NoodlBase from '../Base'
import type NoodlValue from '../Value'
import type NoodlString from '../String'
import type NoodlObject from '../Object'
import type NoodlProperty from '../Property'
import { nkey } from '../constants'

const hasOwnProp = Object.prototype.hasOwnProperty
const nkeys = Object.values(nkey)

const is = {
  node: (v: any): v is NoodlBase => nkeys.some((key) => v?.__ntype === key),
  baseNode: (v: any): v is NoodlBase => v?.__ntype === nkey.base,
  valueNode: (v: any): v is NoodlBase => v?.__ntype === nkey.value,
  stringNode: (v: any): v is NoodlBase => v?.__ntype === nkey.string,
  propertyNode: (v: any): v is NoodlBase => v?.__ntype === nkey.property,
  objectNode: (v: any): v is NoodlBase => v?.__ntype === nkey.object,
  reference: (v: string | NoodlString<string>): v is ReferenceString => {
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
}

export default is
