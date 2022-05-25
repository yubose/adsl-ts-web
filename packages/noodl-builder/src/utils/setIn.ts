import { isArr, isObj, isStr, isNum, set } from './fp'
import is from './is'
import type { Path } from '../types'
import type NoodlBase from '../Base'

/**
 * Utility to create deeply nested key/values with support of retaining them as nodes
 *
 * @param { object | NoodlBase } obj
 * @param { Path | Path[number] } path
 * @param { any } value
 * @param { boolean } [asNodes]
 * @returns { object | NoodlBase }
 */
function setIn(
  obj: Record<string, any> | NoodlBase,
  path: Path | Path[number],
  value: any,
  asNodes = true,
) {
  if (is.node(obj)) {
    set(obj, path, value, function setter(o, p, v) {
      console.log({
        original: { obj, set, path },
        args: {
          o,
          p,
          v,
        },
      })
      return { f: 'a' }
    })
  } else if (isArr(obj) || isObj(obj)) {
    set(obj, path, value)
  }

  return obj
}

export default setIn
