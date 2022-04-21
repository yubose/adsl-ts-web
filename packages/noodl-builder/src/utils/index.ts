export { default as toString } from './toString'
export { default as typeOf } from './typeOf'
import { Identify } from 'noodl-types'
import NoodlBase from '../Base'
import NoodValue from '../Value'
import NoodString from '../String'
import NoodlObject from '../Object'
import NoodProperty from '../Property'

const isArr = (v: any): v is any[] => Array.isArray(v)
const isObj = (v: any): v is Record<string, any> =>
  !!v && !isArr(v) && typeof v == 'object'

export function createObject(
  this: NoodlObject | any,
  key?: string,
  value?: any,
) {
  const object = new NoodlObject(NoodlObject.is(this) ? this : undefined)
  if (key !== undefined) {
    object.createProperty(key)
  }
}

export const is = {
  ...Identify,
}
