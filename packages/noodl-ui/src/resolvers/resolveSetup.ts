import * as u from '@jsmanifest/utils'
import * as nu from 'noodl-utils'
import get from 'lodash/get'
import { Identify } from 'noodl-types'
import Resolver from '../Resolver'
import cache from '../_cache'
import isNUIPage from '../utils/isPage'
import * as c from '../constants'
import * as n from '../utils/noodl'

const setupResolver = new Resolver('resolveSetup')

setupResolver.setResolver(
  async (component, { getAssetsUrl, getRoot, page }, next) => {
    const { path } = component.blueprint || {}
    // Overrides the NUI getter for 'path' if the if object evaluates to a
    // reference string. This ensures that JavaScript keeps an implicit
    // binding and resolves the if object correctly whenever path is being
    // accessed.

    if (Identify.if(path)) {
      const parentPage = page.page
      // Should be in the form of a reference (ex: '..infoPage)
      const evaluatedPath = n.evalIf(path)

      if (u.isStr(evaluatedPath)) {
        if (Identify.reference(evaluatedPath)) {
          const reference = evaluatedPath
          const datapath = nu.trimReference(reference)
          const originalGet = component?.get?.bind(component)
          const isLocal = Identify.localKey(datapath)

          if ((isLocal && page?.page) || !isLocal) {
            const getDataObject = () =>
              isLocal ? getRoot()[parentPage || ''] : getRoot()

            const wrapGetter = function (key: string, styleKey?: string) {
              if (key === 'path') {
                let value = get(getDataObject(), datapath) || ''
                if (value === 'PatientInfo') debugger
                if (Identify.component.page(this)) {
                  const nuiPage = this.get('page')
                  if (isNUIPage(nuiPage)) {
                    if (nuiPage.page !== value) {
                      nuiPage.page = value
                      // TODO - Make this emit a different event that has a
                      // more accurate reason for this emit
                      this.emit(c.nuiEvent.component.page.PAGE_COMPONENTS, {
                        page: nuiPage,
                        type: 'update',
                      })
                    }
                  }
                }
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
              let currentValue = get(getDataObject(), datapath) as string
              let isPageComponent = Identify.component.page(component)
              Object.defineProperty(getDataObject(), datapath, {
                configurable: true,
                enumerable: true,
                get() {
                  return currentValue
                },
                set(newValue: string) {
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

    return next?.()
  },
)

export default setupResolver
