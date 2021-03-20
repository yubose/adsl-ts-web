import {
  ActionConsumerCallbackOptions,
  findParent,
  Page,
  StoreActionObject,
  StoreBuiltInObject,
} from 'noodl-ui'
import { isPageConsumer } from './utils'

const consumerOptionsDependenciesPropKeys = [
  'assetsUrl',
  'componentCache',
  'createSrc',
  'getContext',
  'page',
  'resolveComponents',
  'root',
] as const

class NOODLUIDOMInternal {
  static _createStoreObject(obj: StoreActionObject | StoreBuiltInObject) {
    const cachedFn = obj.fn
    function fn(...args: Parameters<StoreActionObject['fn']>) {
      const component = args[1]?.component
      if (isPageConsumer(component)) {
        // prettier-ignore
        const page = findParent(component, (p) => p?.type === 'page') as Page
        if (page) {
          return cachedFn(
            args[0],
            Object.entries(args[1]).reduce(
              (
                acc,
                [key, value]: [
                  typeof consumerOptionsDependenciesPropKeys[number],
                  any,
                ],
              ) => {
                const props = {}
                if (key === 'assetsUrl') {
                  props['assetsUrl'] = page.getAssetsUrl()
                } else if (key === 'createSrc') {
                  props['createSrc'] = page.createSrc.bind(page)
                } else if (key === 'getContext') {
                  props['getContext'] = page.getContext.bind(page)
                } else if (key === 'resolveComponents') {
                  props['resolveComponents'] = page.resolveComponents.bind(page)
                } else if (key === 'root') {
                  props['root'] = page.getRoot()
                } else {
                  props[key] = value
                }
                return Object.assign(acc, props)
              },
              {},
            ) as ActionConsumerCallbackOptions,
            args[2],
          )
        }
      }
      return cachedFn(...args)
    }

    obj.fn = fn
    return obj
  }
}

export default NOODLUIDOMInternal
