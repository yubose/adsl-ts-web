import { BuiltInObject, EmitActionObject, IfObject } from 'noodl-ui'
import * as T from './types'

/* -------------------------------------------------------
  ---- COMPONENTS
-------------------------------------------------------- */

export function createImage(opts: Partial<T.INOODLImage>) {
  return { type: 'image', ...opts } as T.INOODLImage
}

export function createList(opts: Partial<T.INOODLList>) {
  return { type: 'list', ...opts } as T.INOODLList
}

export function createListItem(opts: Partial<T.INOODLListItem>) {
  return { type: 'listItem', ...opts } as T.INOODLListItem
}

export function createView(opts: Partial<T.INOODLView>) {
  return { type: 'view', ...opts } as T.INOODLView
}

/* -------------------------------------------------------
  ---- ACTION CHAIN
-------------------------------------------------------- */

/* -------------------------------------------------------
  ---- ACTIONS
-------------------------------------------------------- */

export function createBuiltInObject(args: Partial<T.IBuiltInAction>) {
  return {
    funcName: '',
    actionType: 'builtIn',
    ...args,
  } as T.IBuiltInAction
}

export function createEmitObject({ dataKey, actions }: Partial<T.IEmitAction>) {
  return { emit: { dataKey, actions } } as T.IEmitAction
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
