import { PartialDeep } from 'type-fest'
import { ActionObject, ComponentObject } from 'noodl-types'
import {
  NUIAction,
  NUIActionObjectInput,
  NUIComponent,
  NUITrigger,
} from 'noodl-ui'
import * as u from '@jsmanifest/utils'

export type ActionProps<C extends PartialDeep<ActionObject> = ActionObject> = C

export type ComponentProps<
  C extends Partial<ComponentObject> | NUIComponent.Instance,
> = Partial<
  Record<
    NUITrigger,
    (C extends ComponentObject ? NUIActionObjectInput : NUIAction)[]
  >
> &
  C

export function createActionWithKeyOrProps<O extends NUIActionObjectInput>(
  defaultProps: Partial<O>,
  key: keyof O,
) {
  const createObj = (props?: string | ActionProps<O>): O => {
    const obj = { ...(defaultProps as object) } as NUIActionObjectInput
    if (u.isStr(key)) {
      if (u.isObj(props)) {
        if (key in props) u.assign(obj, props)
      } else obj[key as any] = props
    } else if (u.isObj(key)) {
      u.assign(obj, key)
    }
    u.isObj(props) && u.assign(obj, props)
    return obj as O
  }
  return createObj
}

export function createComponentWithKeyOrProps<
  O extends Partial<ComponentObject> | NUIComponent.Instance,
>(defaultProps: Partial<O>, key: string | Partial<Record<string, any>>) {
  const createObj = (props?: string | Partial<O>): O => {
    const obj = { ...defaultProps } as O
    if (u.isStr(key)) {
      if (u.isObj(props)) {
        if (key in props) u.assign(obj, props)
      } else obj[key] = props
    } else if (u.isObj(key)) {
      u.assign(obj, key)
    }
    u.isObj(props) && u.assign(obj, props)
    return obj as O
  }
  return createObj
}
