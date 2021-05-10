import { ActionObject, ComponentObject } from 'noodl-types'
import { NUIActionObjectInput, NUITrigger } from 'noodl-ui'
import * as u from '@jsmanifest/utils'

export type ActionProps<
  C extends Partial<ActionObject> = ActionObject
> = Partial<C>

export type ComponentProps<
  C extends Partial<ComponentObject> = ComponentObject
> = Partial<{ [K in NUITrigger]: NUIActionObjectInput[] } & C>

export function createActionWithKeyOrProps<O extends NUIActionObjectInput>(
  defaultProps: O,
  key: keyof O,
) {
  const createObj = (props?: string | ActionProps<O>): O => {
    const obj = { ...(defaultProps as object) } as NUIActionObjectInput
    if (typeof key === 'string') obj[key as any] = props
    else if (props) Object.assign(obj, props)
    return obj as O
  }
  return createObj
}

export function createComponentWithKeyOrProps<O extends ComponentObject>(
  defaultProps: O,
  key: string | Record<string, any>,
) {
  const createObj = (props?: string | ComponentProps<O>): O => {
    const obj = { ...defaultProps } as ComponentObject
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
