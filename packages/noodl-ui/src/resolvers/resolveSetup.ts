import * as u from '@jsmanifest/utils'
import * as nu from 'noodl-utils'
import get from 'lodash/get'
import { Identify } from 'noodl-types'
import Resolver from '../Resolver'
import cache from '../_cache'
import * as n from '../utils/noodl'

const setupResolver = new Resolver('resolveSetup')

setupResolver.setResolver(async (component, { getRoot, page }, next) => {
  const { path } = component.blueprint || {}
  // if (Identify.if(path)) {
  // Override the NUI getter for 'path' if the if object evaluates to a
  // reference string. This ensures that JavaScript keeps an implicit
  // binding and resolves the if object correctly whenever path is being
  // accessed.

  if (Identify.if(component.get('path'))) {
    const resolvedPath = n.evalIf(path)

    if (u.isStr(resolvedPath)) {
      if (Identify.reference(resolvedPath)) {
        const reference = resolvedPath
        const datapath = nu.trimReference(reference)
        const originalGet = component?.get?.bind(component)
        const isLocal = Identify.localKey(datapath)

        if ((isLocal && page?.page) || !isLocal) {
          const getDataObject = () =>
            isLocal ? getRoot()[page?.page || ''] : getRoot()

          const wrapGetter = (key: string, styleKey?: string) => {
            if (key === 'path') {
              let value = get(getDataObject(), datapath) || ''
              return value
            }
            return originalGet(key, styleKey)
          }

          Object.defineProperty(component, 'get', {
            configurable: true,
            enumerable: true,
            get() {
              return wrapGetter
            },
          })

          if (u.isObj(getDataObject())) {
            let currentValue = getDataObject()?.[datapath] as string
            let isPageComponent = Identify.component.page(component)
            Object.defineProperty(getDataObject(), datapath, {
              configurable: true,
              enumerable: true,
              get() {
                return currentValue
              },
              set(newValue: string) {
                // debugger
                if (isPageComponent) {
                  const cacheObj = cache.page.get(component.id)
                  if (cacheObj?.page) {
                    if (cacheObj.page.page !== currentValue) {
                      cacheObj.page.page = currentValue
                      // debugger
                    }
                  }
                }
                currentValue = newValue
              },
            })
          }
        }
      }
    }
  } else if (
    u.isStr(component.get('path')) &&
    Identify.reference(component.get('path'))
  ) {
    // const reference = component.get('path')
    // const datapath = nu.trimReference(reference)
    // const originalGet = component?.get?.bind(component)
    // const isLocal = Identify.localKey(datapath)
    // if ((isLocal && page?.page) || !isLocal) {
    //   const getDataObject = () =>
    //     isLocal ? getRoot()[page?.page || ''] : getRoot()
    //   const wrapGetter = (key: string, styleKey?: string) => {
    //     if (key === 'path') {
    //       let value =
    //         n.resolveAssetUrl(get(getDataObject(), datapath), {
    //           assetsUrl: getAssetsUrl(),
    //         }) || ''
    //       return value
    //     }
    //     return originalGet(key, styleKey)
    //   }
    //   Object.defineProperty(component, 'get', {
    //     configurable: true,
    //     enumerable: true,
    //     get() {
    //       return wrapGetter
    //     },
    //   })
    // }
  }
  // }

  return next?.()
})

export default setupResolver
