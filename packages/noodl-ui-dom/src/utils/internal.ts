import { isComponent, NUIComponent } from 'noodl-ui'

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

export const xKeys = ['width', 'left']
export const yKeys = ['height', 'top']
export const posKeys = [...xKeys, ...yKeys]
