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
    // Overrides the NUI getter for 'path' if the if object evaluates to a
    // reference string. This ensures that JavaScript keeps an implicit
    // binding and resolves the if object correctly whenever path is being
    // accessed.

    // if (nt.Identify.if(path)) {
    //   const parentPage = page.page
    //   // Should be in the form of a reference (ex: '..infoPage)
    //   const evaluatedPath = n.evalIf(path)

    //   if (u.isStr(evaluatedPath)) {
    //     if (nt.Identify.reference(evaluatedPath)) {
    //       const reference = evaluatedPath
    //       const datapath = nu.trimReference(reference)
    //       const originalGet = component?.get?.bind(component)
    //       const isLocal = nt.Identify.localKey(datapath)

    //       if ((isLocal && page?.page) || !isLocal) {
    //         const getDataObject = () =>
    //           isLocal ? getRoot()[parentPage || ''] : getRoot()

    //         const wrapGetter = function (
    //           this: t.NuiComponent.Instance,
    //           key: string,
    //           styleKey?: string,
    //         ) {
    //           if (key === 'path') {
    //             let value = get(getDataObject(), datapath) || ''
    //             if (nt.Identify.component.page(this)) {
    //               const nuiPage = this.get('page')
    //               if (isNUIPage(nuiPage)) {
    //                 if (nuiPage.page !== value) {
    //                   nuiPage.page = value
    //                   const pageComponent = cache.component.get(
    //                     nuiPage.id as string,
    //                   )?.component
    //                   if (pageComponent) {
    //                     pageComponent.on?.[
    //                       c.nuiEvent.component.page.PAGE_COMPONENTS
    //                     ]?.forEach?.((fn) => fn?.({ page: nuiPage }))
    //                     // TODO - Make this emit a different event that has a
    //                     // more accurate reason for this emit
    //                     pageComponent.emit(
    //                       c.nuiEvent.component.page.PAGE_COMPONENTS,
    //                       {
    //                         page: nuiPage,
    //                         type: 'update',
    //                       },
    //                     )
    //                   }
    //                 }
    //               }
    //             }
    //             return value
    //           }
    //           return originalGet(key, styleKey)
    //         }

    //         Object.defineProperty(component, 'get', {
    //           configurable: true,
    //           enumerable: true,
    //           get() {
    //             return wrapGetter
    //           },
    //         })

    //         if (u.isObj(getDataObject())) {
    //           let currentValue = get(getDataObject(), datapath) as string
    //           let isPageComponent = nt.Identify.component.page(component)
    //           Object.defineProperty(getDataObject(), datapath, {
    //             configurable: true,
    //             enumerable: true,
    //             get() {
    //               return currentValue
    //             },
    //             set(newValue: string) {
    //               if (isPageComponent) {
    //                 const cacheObj = cache.page.get(component.id)
    //                 if (cacheObj?.page) {
    //                   if (cacheObj.page.page !== currentValue) {
    //                     cacheObj.page.page = currentValue
    //                   }
    //                 }
    //               }
    //               currentValue = newValue
    //             },
    //           })
    //         }
    //       }
    //     }
    //   }
    // }

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
