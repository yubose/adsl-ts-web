import { Path } from '../types'

const hasOwnProperty = Object.prototype.hasOwnProperty

const regex = {
  backlash: /\\(\\)?/g,
  leadingDot: /^\./,
  deepProperty: /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
  plainProperty: /^\w*$/,
  property:
    /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,
} as const

/**
 * Wraps val into an array if it isn't already one
 * @example
 * let num = 42
 * let arrayNum = array(num) // [42]
 * arrayNum = array(arrayNum) // [42]
 * @param { any } val
 */
export function array<O extends any[], P extends O[number]>(val: P | P[]): P[] {
  return isArr(val) ? val : [val]
}

/**
 * Returns true using the SameEqualityZero comparison algorithm
 * http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero
 * @param objValue
 * @param value
 * @returns { boolean }
 */
export function eq(objValue: any, value: any) {
  return objValue === value || (objValue !== objValue && value !== value)
}

export function isArr<O>(v: unknown): v is O extends any[] ? O : O[] {
  return Array.isArray(v)
}

/** Returns true if we are in a browser environment */
export function isBrowser() {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined'
}

/** Returns true if value is an Error instance */
export function isErr(v: any): v is Error {
  return isObj(v) && (v instanceof Error || ('stack' in v && 'message' in v))
}

/** Returns true if val is null or undefined */
export function isNil(v: any): v is null | undefined {
  return v === null || typeof v === 'undefined'
}

export function isNum(v: unknown): v is number {
  return typeof v === 'number'
}

/**
 * Checks if value is a valid array-like index.
 * @param { number } value
 * @returns { boolean }
 */
export function isIndex(v: unknown): v is string | number {
  return (
    (isNum(v) || (isStr(v) && /^(?:0|[1-9]\d*)$/.test(v))) &&
    v > -1 &&
    (v as number) % 1 == 0 &&
    v < Number.MAX_SAFE_INTEGER
  )
}

export function isObj<O extends Record<string, any> = Record<string, any>>(
  v: unknown,
): v is O & Record<string, any> {
  return !!v && !isArr(v) && typeof v == 'object'
}

/** Like typeof val === 'string' */
export function isStr(v: any): v is string {
  return typeof v === 'string'
}

/**
 * Retrieves a value in obj using path
 * @param { Record<string, any> | any[] } obj
 * @param { Path[number] | Path } path
 * @returns { any }
 */
export function get(
  obj: Record<string, any> | any[],
  path: string | number | Path,
) {
  let _index = 0
  let _path = toPath(path)
  let _len = _path.length

  while (obj != null && _index < _len) {
    let nextKey = _path[_index++]
    let nextKeyPath = toPath(nextKey) || []
    let key = (nextKeyPath?.join?.('.') || '') as keyof typeof obj
    obj = obj[key]
  }

  return _index && _index == _len ? obj : undefined
}

/** Returns a shallow copy of obj with keys removed */
export function omit<O extends Record<string, any>, K extends keyof O>(
  obj: O,
  _keys: K | K[],
) {
  return Object.keys(obj).reduce((acc, key) => {
    if (!isNil(key)) {
      if ((_keys as K[]).includes(key as K)) return acc
      acc[key] = obj[key]
    }
    return acc
  }, {} as Omit<O, K>)
}

/** Returns a shallow copy of obj only including the ones in keys picked from obj */
export function pick<O extends Record<string, any>, K extends keyof O>(
  obj: O,
  _keys: K | K[] = [],
) {
  return array(_keys).reduce((acc, key, _, collection) => {
    if (key && isStr(key)) {
      if (collection.includes(key)) acc[key] = get(obj, key) as O[K]
    }
    return acc
  }, {} as Pick<O, K>)
}

/**
 * Sets the value at `path` of `object`. If a portion of `path` doesn't exist,
 * it's created. Arrays are created for missing index properties while objects
 * are created for all other missing properties.
 *
 * If a custom setter function is provided it will be used to set the values
 *
 * @category Object
 * @param { object } object The object to modify.
 * @param { Path | Path[number] } path The path of the property to set.
 * @param { any } value The value to set.
 *
 * @example
 * const object = { 'a': [{ 'b': { 'c': 3 } }] };
 * set(object, 'a[0].b.c', 4);
 * console.log(object.a[0].b.c); // Result: 4
 */
export function set(
  obj: any,
  path: Path | Path[number],
  value: any,
  setter?: (obj: any, path: Path | Path[number], value: any) => any,
) {
  if (!isObj(obj)) return obj

  path = toPath(path)

  let index = -1
  let len = path.length
  let lastIndex = len - 1
  let nested = obj

  while (nested != null && ++index < len) {
    let key = toKey(path[index])
    let newValue = value

    if (index != lastIndex) {
      let objValue = nested[key]

      newValue = setter ? setter(objValue, key, nested) : undefined

      if (newValue === undefined) {
        newValue = isObj(objValue)
          ? objValue
          : isIndex(path[index + 1])
          ? []
          : {}
      }
    }

    if (
      !(hasOwnProperty.call(nested, key) && eq(nested[key], newValue)) ||
      (newValue === undefined && !(key in nested))
    ) {
      nested[key] = newValue
    }

    nested = nested[key]
  }

  return obj
}

export function spread<KeyVal extends [any, any] = [any, any]>(
  fn: (...keyVal: KeyVal) => void,
) {
  return (keyVal: KeyVal) => fn(...keyVal)
}

/**
 * Converts value to a string key
 * @param { any } value
 * @returns { string }
 */
export function toKey(value: any) {
  if (isStr(value)) return value
  return String(value)
}

/**
 * Casts the value to a path array if it isn't already one
 * @param v Value
 * @returns { string[] }
 */
export function toPath(v: any): Path {
  if (isArr(v)) return v as Path
  if (isStr(v)) {
    const result = [] as string[]

    if (regex.leadingDot.test(v) || v === '') {
      result.push('')
    }

    v.replace(
      regex.property,
      // @ts-expect-error
      (match, num, quote, str) => {
        result.push(quote ? str.replace(/\\(\\)?/g, '$1') : num || match)
      },
    )

    return result
  }
  return [v] as Path
}
