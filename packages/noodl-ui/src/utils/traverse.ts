// INACTIVE
// @ts-nocheck

import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import flip from 'lodash/flip'
import get from 'lodash/get'
import partialRight from 'lodash/partialRight'
import type { OrArray } from '@jsmanifest/typefest'
import * as t from '../types'

export type VisitReturn = 'SKIP' | null | void
export type VisitPath = (string | number)[]
export interface VisitHooks<
  Props extends Record<string, any> = Record<string, any>,
> {
  action?(args: {
    key: null | number
    trigger: t.NUITrigger
    value: nt.ActionObject | nt.EmitObjectFold | nt.GotoObject
    component: Props
    parent: OrArray<nt.ActionObject | nt.EmitObjectFold | nt.GotoObject>
    path: VisitPath
  }): VisitReturn
  actionChain?(args: {
    trigger: t.NUITrigger
    value: OrArray<nt.ActionObject | nt.EmitObjectFold | nt.GotoObject>
    path: VisitPath
    component: Props
  }): VisitReturn
  component?(args: {
    key: null | number
    type: t.NuiComponentType
    value: nt.ComponentObject
    parent: nt.ComponentObject | null
    path: VisitPath
  }): VisitReturn
  style?(args: {
    key: string
    value: nt.StyleObject
    component: Props
    path: VisitPath
  }): VisitReturn
}

function traverse<Props extends Record<string, any> = Record<string, any>>(
  props: Props | (() => VisitHooks),
  callback: (
    key: string | number | null,
    value: any,
    path: VisitPath,
  ) => VisitReturn,
  path = [] as (string | number)[],
) {
  if (u.isNil(props)) return
  if (u.isFnc(props)) return flip(partialRight(visitHooks, props()))

  let result = callback(null, props, path)

  if (result === 'SKIP') return

  if (u.isArr(props)) {
    const numProps = props.length
    for (let index = 0; index < numProps; index++) {
      const value = props[index]
      result = callback(index, value, path.concat(index))
      if (result === 'SKIP') continue

      if (!u.isNil(value)) {
        traverse(value, callback, path.concat(index))
      }
    }
  } else if (u.isObj(props)) {
    for (const [key, value] of u.entries(props)) {
      result = callback(key, value, path.concat(key))
      if (result === 'SKIP') continue

      if (!u.isNil(value)) {
        traverse(value, callback, path.concat(key))
      }
    }
  }
}

export function visitHooks<
  Props extends
    | nt.ComponentObject
    | t.NuiComponent.Instance = nt.ComponentObject,
>(props: Props, { action, actionChain, component, style }: VisitHooks) {
  function getParent(_props: typeof props, path: VisitPath = []) {
    const index = path.lastIndexOf('children')
    if (index === 0) return _props
    if (index > 0) return get(_props, path.slice(0, index))
    return null
  }

  traverse(props, function callback(key, value, path) {
    let result: VisitReturn | undefined

    // Some value (Either an item in an array or some top-level value)
    if (key === null) {
      if (nt.Identify.folds.component.any(value)) {
        const key = path[path.length - 1]
        const parent = getParent(props, path)
        result = component?.({
          key: u.isNum(key) ? key : null,
          type: value.type,
          value,
          parent,
          path,
        })
      }
      if (result === 'SKIP') return 'SKIP'
    }
    // Key/value pair
    else if (u.isStr(key)) {
      if (key === 'style') {
        if (u.isObj(value)) {
          result = style?.({
            key,
            value,
            component: props,
            path,
          })
        }
      } else {
        if (u.isStr(value)) {
          //
        } else if (u.isArr(value)) {
          if (nt.Identify.actionChain(value)) {
            result = actionChain?.({
              trigger: key as t.NUITrigger,
              value,
              component: props,
              path,
            })

            if (result === 'SKIP') return

            for (let index = 0; index < value.length; index++) {
              action?.({
                key: index,
                trigger: key as t.NUITrigger,
                value: value[index],
                path: path.concat(index),
                parent: value,
                component: props,
              })
            }
          }
        } else if (u.isObj(value)) {
        }
      }

      if (result === 'SKIP') return 'SKIP'
    }
    // Item in an array
    else if (u.isNum(key)) {
      //
    }

    return result
  })
}

export default traverse
