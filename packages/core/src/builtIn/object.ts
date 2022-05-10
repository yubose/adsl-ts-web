import * as fp from '../utils/fp'
// import set from 'lodash/set'
// import unset from 'lodash/unset'
import * as is from '../utils/is'

const set = (...args: any[]) => {}
const unset = (...args: any[]) => {}

const objectBuiltIns = {
  clear: ({ object, key }) => {
    object[key] = ''
  },
  extract: ({ array, field }) => {
    return array.map((item: any) => fp.get(item, field))
  },
  get: ({ object, key }) => {
    if (object[key] == '') object[key] = ' '
    return object[key]
  },
  has: ({ object, key }) => {
    return key in object && !!object[key]
  },
  remove: ({ object, key }) => {
    unset(object, key)
  },
  set: ({ object, key, value }) => {
    set(object, key, value)
  },
}

export default fp.entries(objectBuiltIns).reduce((acc, [key, fn]) => {
  acc[key] = (...args: any[]) => {
    if (is.obj(args[0]?.object)) return (fn as any)(...args)
  }
  return acc
}, {} as typeof objectBuiltIns)
