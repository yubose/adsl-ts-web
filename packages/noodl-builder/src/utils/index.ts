export { default as is } from './is'
export { default as toString } from './toString'
export { default as typeOf } from './typeOf'
export { default as unwrap } from './unwrap'
export * as fp from './fp'
import NoodlObject from '../Object'

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
