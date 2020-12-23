import * as T from 'noodl-types'
import { IfObject } from 'noodl-ui'

/* -------------------------------------------------------
  ---- COMPONENTS
-------------------------------------------------------- */

export function createComponent<C extends T.ComponentObject = any>(
  opts?: Partial<C>,
) {
  return { ...opts } as C
}

export function createImage(opts: Partial<T.ImageComponentObject>) {
  return createComponent({ type: 'image', ...opts })
}

export function createList(opts: Partial<T.ListComponentObject>) {
  return createComponent({ type: 'list', ...opts }) as T.ListComponentObject
}

export function createListItem(opts: Partial<T.ListItemComponentObject>) {
  return createComponent({
    type: 'listItem',
    ...opts,
  }) as T.ListItemComponentObject
}

export function createView(opts: Partial<T.ViewComponentObject>) {
  return createComponent({ type: 'view', ...opts }) as T.ViewComponentObject
}

/* -------------------------------------------------------
  ---- ACTION CHAIN
-------------------------------------------------------- */

/* -------------------------------------------------------
  ---- ACTIONS
-------------------------------------------------------- */

export function createBuiltInObject(args: Partial<T.BuiltInActionObject>) {
  return {
    funcName: '',
    actionType: 'builtIn',
    ...args,
  } as T.BuiltInActionObject
}

export function createEmitObject({ dataKey, actions }: Partial<T.EmitObject>) {
  return { emit: { dataKey, actions } } as T.EmitObject
}

/* -------------------------------------------------------
  ---- OTHER
-------------------------------------------------------- */

export function createIfObject(cond: any, val1: any, val2: any): IfObject {
  return {
    if: [cond, val1, val2],
  } as IfObject
}

export function createPath(val: string): string
export function createPath(val: { cond: any; val1: any; val2: any }): IfObject
export function createPath(
  val: string | { cond: Function; val1: any; val2: any },
) {
  if (typeof val === 'string') {
    return val
  } else {
    return createIfObject(val.cond, val.val1, val.val2)
  }
}
