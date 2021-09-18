import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as t from '../types'
import type NuiPage from '../Page'
import { defaultResolveIf, defaultResolveReference } from './internal'
import resolveReference from './resolveReference'
import resolvePageComponentUrl from './resolvePageComponentUrl'

export default function dereferenceObject<O extends Record<string, any>>(
  obj: O,
) {
  for (const [key, value] of u.entries(obj)) {
    if (u.isStr(value)) {
      if (nt.Identify.pageComponentUrl(value)) {
        Object.defineProperty(obj, key, {
          configurable: true,
          enumerable: true,
          get() {
            return resolvePageComponentUrl({
              component,
              page,
              key,
              value,
              localKey: page?.page,
              on,
              root: getRoot,
            })
          },
        })
      }

      if (nt.Identify.reference(value)) {
        Object.defineProperty(obj, key, {
          configurable: true,
          enumerable: true,
          get() {
            return resolveReference({
              component,
              page,
              key,
              value,
              localKey: page?.page,
              on,
              root: getRoot,
            })
          },
        })
      }
    } else if (u.isArr(value)) {
      Object.defineProperty(obj, key, {
        configurable: true,
        enumerable: true,
        get() {
          return value.map((val) =>
            u.isObj(val) ? dereferenceObject(val) : val,
          )
        },
      })
    } else if (u.isObj(value)) {
      let value = this.blueprint[key]

      if (u.isStr(value)) {
      } else if (nt.Identify.if(value)) {
        if (on?.if) {
          value = on.if({ component, page, key, value })
            ? value.if?.[1]
            : value.if?.[2]

          if (nt.Identify.reference(value)) {
            return resolveReference({
              component,
              page,
              key,
              value,
              localKey: page?.page,
              on,
              root: getRoot,
            })
          }

          return value
        }

        value = defaultResolveIf(value)

        if (nt.Identify.reference(value)) {
          Object.defineProperty(obj, key, {
            configurable: true,
            enumerable: true,
            get() {
              return resolveReference({
                component,
                page,
                key,
                value,
                localKey: page?.page,
                on,
                root: getRoot,
              })
            },
          })
        }
      } else if (!this) return origGet?.(key)
      //
    }
  }
}
