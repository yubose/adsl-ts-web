import cloneDeep from 'lodash.clonedeep'

type Path = (string | symbol | number)[]

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
  let _path = toPath(path) as Path
  let _len = _path.length

  while (obj != null && _index < _len) {
    let nextKey = _path[_index++]
    let nextKeyPath = (toPath(nextKey) || []) as Path
    let key = (nextKeyPath?.join?.('.') || '') as keyof typeof obj
    obj = obj[key]
  }

  return _index && _index == _len ? obj : undefined
}

export function isArr<V extends any[] = any[]>(value: unknown): value is V {
  return Array.isArray(value)
}

export function spread<
  Fn extends (
    key: string,
    value: any,
  ) => ReturnType<Fn> extends infer P ? P : any,
>(fn: Fn): (tuple: [key: any, value: any]) => Fn extends infer P ? P : any {
  // @ts-expect-error
  return (tuple) => fn(...tuple)
}

export function isObj<V extends Record<string, any> = Record<string, any>>(
  value: unknown,
): value is V {
  return !!value && !isArr(value) && typeof value === 'object'
}

export function isStr(value: unknown): value is string {
  return typeof value === 'string'
}

export function iSymb(value: unknown): value is symbol {
  return (
    typeof value === 'symbol' ||
    Object.prototype.toString.call(value) === '[object Symbol]'
  )
}

export function toArr<V = any>(value: V) {
  return (isArr(value) ? value : [value]) as V extends any[] ? V : V[]
}
/**
 * Replaces Uint8Array values with base64 values
 *
 * @param source Object that needs values replaced.
 * @returns Object that has had Uint8Array values mapped to base64.
 */
export function replaceUint8ArrayWithBase64(
  source: Record<string, any> | any[],
): Record<string, any> {
  let sourceCopy = cloneDeep(source || {})
  if (isArr(source)) {
    sourceCopy = source.map((elem) => replaceUint8ArrayWithBase64(elem))
  } else if (isObj(source)) {
    Object.keys(sourceCopy).forEach((key) => {
      if (sourceCopy[key] instanceof Uint8Array) {
        sourceCopy[key] = uint8ArrayToBase64(sourceCopy[key])
      } else if (isObj(sourceCopy[key])) {
        sourceCopy[key] = replaceUint8ArrayWithBase64(sourceCopy[key])
      } else if (
        isArr(sourceCopy[key]) &&
        !(sourceCopy[key] instanceof Uint8Array)
      ) {
        sourceCopy[key] = sourceCopy[key].map((elem) =>
          replaceUint8ArrayWithBase64(elem),
        )
      }
    })
  }
  return sourceCopy
}

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
export function toKey(value: any) {
  if (isStr(value) || iSymb(value)) return value
  const result = value + ''
  return result == '0' && 1 / value == 1 / 0 ? '-0' : result
}

/**
 * Casts the value to a path array if it isn't already one
 * @param v Value
 * @returns { string[] }
 */
export function toPath<V = any>(v: V): Path | V[] {
  if (isArr(v)) return v
  if (isStr(v)) return v.split('.')
  return [v]
}

/**
 *
 * @param data
 *
 * encodes Uint8Array data to base64 string
 */
export function uint8ArrayToBase64(data: Uint8Array): string {
  if (typeof atob === 'undefined') {
    if (typeof Buffer.from !== 'undefined') {
      return Buffer.from(data).toString('base64')
    }
    return new Buffer(data).toString('base64')
  }
  let i: number
  let s = [] as string[]
  let len = data.length
  for (i = 0; i < len; i++) s.push(String.fromCharCode(data[i]))
  return btoa(s.join(''))
}
