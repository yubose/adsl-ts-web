import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import Resolver from '../Resolver'
import resolveReference from '../utils/resolveReference'
import resolvePageComponentUrl from '../utils/resolvePageComponentUrl'
import * as i from '../utils/internal'
import * as t from '../types'

const setupResolver = new Resolver('resolveSetup')

setupResolver.setResolver(async function setupResolver(
  component,
  options,
  next,
) {
  try {
    const { getRoot, on, page } = options

    if (u.isObj(component.blueprint)) {
      const origGet = component.get.bind(component)

      const _getter = function getter(
        this: t.NuiComponent.Instance,
        key: string,
      ) {
        let value = this.blueprint[key]

        if (u.isStr(value)) {
          if (nt.Identify.pageComponentUrl(value)) {
            return resolvePageComponentUrl({
              component,
              page,
              key,
              value,
              localKey: page?.page,
              on,
              root: getRoot,
            })
          }

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

          value = i.defaultResolveIf(value)

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
        } else if (!this) return origGet?.(key)

        return origGet(key)
      }

      Object.defineProperty(component, 'get', {
        configurable: true,
        enumerable: true,
        get() {
          return _getter.bind(this)
        },
      })
    }
  } catch (error) {
    console.error(error)
  }

  return next?.()
})

export default setupResolver
