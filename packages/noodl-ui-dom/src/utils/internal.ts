import get from 'lodash/get'
import { NUIComponent } from 'noodl-ui'

/**
 * A helper to grab a value from key from a component or action
 * @param { NUIComponent | ComponentObject | NUIAction | NUIActionObjectInput } obj
 * @param { string } key
 */
export const _pick = (obj: any, key: string, defaultValue?: any) => {
  if (!isObj(obj)) return obj
  let result = obj?.get?.(key)
  if (isUnd(result)) result = get(obj, key)
  if (isUnd(result)) result = get(obj?.blueprint, key)
  if (isUnd(result)) result = get(obj?.original, key)
  return result || defaultValue
}

export const array = <O extends any[], P extends O[number]>(o: P | P[]): P[] =>
  isArr(o) ? o : [o]
export const assign = (
  v: Record<string, any>,
  ...rest: (Record<string, any> | undefined)[]
) => Object.assign(v, ...rest)
export const entries = (v: any) => (isObj(v) ? Object.entries(v) : [])
export const isArr = (v: any): v is any[] => Array.isArray(v)
export const isBool = (v: any): v is boolean => typeof v === 'boolean'
export const isObj = (v: any): v is { [key: string]: any } =>
  !!v && !isArr(v) && typeof v === 'object'
export const isNum = (v: any): v is number => typeof v === 'number'
export const isStr = (v: any): v is string => typeof v === 'string'
export const isUnd = (v: any): v is undefined => typeof v === 'undefined'
export const isNull = (v: any): v is null => v === null
export const isNil = (v: any): v is null | undefined => isNull(v) && isUnd(v)
export const isFnc = <V extends (...args: any[]) => any>(v: any): v is V =>
  typeof v === 'function'
export const keys = (v: any) => Object.keys(v)
export const values = <O extends Record<string, any>, K extends keyof O>(
  v: O,
): O[K][] => Object.values(v)

export function addClassName(className: string, node: HTMLElement) {
  if (!node.classList.contains(className)) {
    node.classList.add(className)
  }
}

export function createGlobalComponentId(
  component: NUIComponent.Instance | string,
) {
  return isStr(component)
    ? component
    : component.get('popUpView') ||
        component.get('viewTag') ||
        component.id ||
        ''
}

function _createDocIdentifier(
  mediaType: number,
  regex: { value: string; flags?: string },
): (component: NUIComponent.Instance) => boolean
function _createDocIdentifier(
  mediaType: number,
  regex: string,
): (component: NUIComponent.Instance) => boolean
function _createDocIdentifier(
  mediaType: number,
  regexStr: string | { value: string; flags?: string },
) {
  const identifyDoc = function _identifyDoc(component: NUIComponent.Instance) {
    const flags = isStr(regexStr) ? 'i' : regexStr.flags
    const regex = isStr(regexStr) ? new RegExp(regexStr, flags) : regexStr.value
    return (
      _pick(component, 'mediaType', '') == mediaType ||
      _pick(component, 'mimeType', '').test?.(regex) ||
      _pick(component, 'name.type', '').test?.(regex)
    )
  }
  return identifyDoc
}

export const isImageDoc = _createDocIdentifier(4, 'image')
export const isMarkdownDoc = _createDocIdentifier(8, 'markdown')
export const isPdfDoc = _createDocIdentifier(1, 'pdf')
export const isTextDoc = _createDocIdentifier(0, '')
export const isWordDoc = _createDocIdentifier(1, '(office|wordprocessingml)')
// export const isVideoDoc = _createDocIdentifier(0, '')

export const xKeys = ['width', 'left']
export const yKeys = ['height', 'top']
export const posKeys = [...xKeys, ...yKeys]
