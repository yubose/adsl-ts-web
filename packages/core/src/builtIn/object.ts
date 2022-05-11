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
  hasMultipleKeys({ object, keyArr }: { object: {}; keyArr: string[] }) {
    if (is.obj(object)) {
      for (let i = 0; i < keyArr.length; i++) {
        if (object.hasOwnProperty(keyArr[i]) === false) {
          return false
        }
      }
    }
    return true
  },
  /**
   * @function
   * @description Loop to determine whether the value of an object under a path is equal to false.
   * If yes, it returns true, and if no, it returns false
   * @param {array} objArr
   * @param {string} valPath
   * @returns {boolean}
   */
  objectHasValue({
    objArr,
    valPath,
  }: {
    objArr: { [key: string]: {} }[]
    valPath: string
  }): boolean {
    return Array.from(objArr).some((obj) => obj[valPath] !== false)
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
