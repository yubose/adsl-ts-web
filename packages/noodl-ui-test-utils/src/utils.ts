import {
  ActionObject,
  ComponentObject,
  userEvent,
  UncommonActionObjectProps,
  UncommonComponentObjectProps,
} from 'noodl-types'
import * as u from '@jsmanifest/utils'

export type ActionProps<C extends Partial<ActionObject> = ActionObject> =
  Partial<UncommonActionObjectProps> & C

export type ComponentProps<C extends Partial<ComponentObject>> = Partial<
  Record<keyof typeof userEvent, ActionObject[]>
> &
  Partial<UncommonComponentObjectProps> &
  C

export function createActionObject_next<
  T extends string,
  O extends ActionObject<T>,
>(actionType: T) {
  return (obj?: Partial<O>) => ({ ...obj, actionType } as O)
}

export function createActionObject<O extends ActionObject>(
  defaultProps: Partial<O>,
  key: keyof O,
) {
  return function (props?: string | ActionProps<O>): O {
    const obj = { ...(defaultProps as object) } as ActionObject
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
}

export function createComponentObject<
  O extends ComponentObject,
  K extends keyof O = keyof O,
>(defaultProps: Partial<O>, key?: K) {
  return function create<P extends K | Partial<O>>(props?: P): O {
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
}
