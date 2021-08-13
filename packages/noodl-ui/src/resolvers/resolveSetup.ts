import * as u from '@jsmanifest/utils'
import * as nu from 'noodl-utils'
import { Identify } from 'noodl-types'
import Resolver from '../Resolver'
import * as n from '../utils/noodl'

const setupResolver = new Resolver('resolveSetup')

setupResolver.setResolver((component, { cache, getRoot, page }, next) => {
  const { path } = component.blueprint || {}
  // if (Identify.if(path)) {
  // Override the NUI getter for 'path' if the if object evaluates to a
  // reference string. This ensures that JavaScript keeps an implicit
  // binding and resolves the if object correctly whenever path is being
  // accessed.

  if (!component.get('path') || Identify.if(component.get('path'))) {
    const resolvedPath = n.evalIf(path)

    if (u.isStr(resolvedPath)) {
      if (Identify.reference(resolvedPath)) {
        const reference = resolvedPath
        const datapath = nu.trimReference(reference)
        const originalGet = component?.get?.bind(component)
        const isLocal = Identify.localKey(datapath)
        const currentPage = page?.page || ''

        if ((isLocal && currentPage) || !isLocal) {
          const getDataObject = () =>
            isLocal ? getRoot()[currentPage] : getRoot()

          const wrapGetter = (key: string, styleKey?: string) => {
            if (key === 'path') {
              return getDataObject()?.[datapath]
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
  }
  // }

  next?.()
})

export default setupResolver
