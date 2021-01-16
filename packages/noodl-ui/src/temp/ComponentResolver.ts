import { ComponentObject } from 'noodl-types'
import pick from 'lodash/pick'
import omit from 'lodash/omit'
import { WritableDraft, current } from 'immer/dist/internal'
import produce, { applyPatches, enablePatches } from 'immer'
import ActionChain from '../ActionChain'
import { getRandomKey } from '../utils/common'
import getStore from '../store'
import componentCache from '../utils/componentCache'
import Viewport from '../Viewport'
import runner from './Runner'
import * as T from '../types'
import * as resolverMap from './resolvers'

enablePatches()

const dataResolverKeys = ['getDataAttrs', 'getEventHandlers'] as const
const dataResolvers = pick(resolverMap, dataResolverKeys)
const staticResolvers = omit(resolverMap, dataResolverKeys)

const _store = {
  get actions() {
    return getStore().actions
  },
  get builtIns() {
    return getStore().builtIns
  },
  // actions: getStore().actions as { [actionType: string]: T.StoreActionObject[] },
  // builtIns: getStore().builtIns as { [funcName: string]: T.StoreBuiltInObject[] },
  resolvers: staticResolvers as {
    [name: string]: T.StoreResolverObject
  },
  pages: new Map<string, PageMaster>(),
}

const ComponentResolver = (function () {
  function createResolverHOF<Options = any>(consumerOptions: Options) {
    return (resolverFn) => (stepFn) => (acc, component) => {
      resolverFn(component, consumerOptions)
      return stepFn(acc, component)
    }
  }

  function composeResolvers(...fns) {
    return (step) => {
      return fns.reduceRight((acc, fn) => fn(acc), step)
    }
  }

  function getConsumerOptions(pageMaster: PageMaster) {
    return {
      componentCache,
      createSrc: pageMaster.createSrc,
      getActionsContext: () => {},
      getActions: () => _store.actions,
      getBuiltIns: () => _store.builtIns,
      getAssetsUrl: pageMaster.getAssetsUrl?.bind(pageMaster),
      getBaseUrl: pageMaster.getBaseUrl?.bind(pageMaster),
      getBaseStyles: pageMaster.getBaseStyles?.bind(pageMaster),
      getCurrentPage: () => pageMaster.page,
      getCbs: pageMaster.getCbs?.bind(pageMaster),
      getPageObject: pageMaster.getPageObject?.bind(pageMaster),
      getPages: pageMaster.getPages?.bind(pageMaster),
      getPreloadPages: pageMaster.getPreloadPages?.bind(pageMaster),
      getResolvers: () => _store.resolvers,
      getRoot: pageMaster.getRoot?.bind(pageMaster),
      getState: pageMaster.getState?.bind(pageMaster),
      viewport: pageMaster.viewport,
    }
  }

  const _ = () => {
    const o = {
      createActionChain() {
        const actionChain = new ActionChain([] as any, {} as any, {} as any)
        return actionChain
      },
      createPage() {
        let page = new PageMaster()
        let viewport = new Viewport()

        const step = (acc: ComponentObject[], component: ComponentObject) =>
          acc.concat(component)

        page.use(viewport)
        page.resolveComponent = (original: ComponentObject) => {
          const composedResolvers = composeResolvers(
            ...Object.values(_store.resolvers)
              .map((obj) => obj.resolve)
              .map(createResolverHOF(getConsumerOptions(page))),
          )
          return produce(original, (draft) => {
            runner.run(draft, composedResolvers(step))
          })
        }

        page.resolveComponents = () => {
          page.components = page.components.map(page.resolveComponent)
          return page.components
        }

        _store.pages.set(page.id, page)
        return page
      },
    }

    return o
  }

  return _()
})()

class PageMaster {
  #page: string = ''
  #resolveComponent: (original: ComponentObject) => any
  #resolveComponents: T.AnyFn
  #components: ComponentObject[] = []
  #viewport: Viewport
  id: string
  obj: any = {}

  constructor() {
    this.id = _store.pages.size ? getRandomKey() : 'root'
  }

  get components() {
    return this.#components
  }

  set components(components) {
    this.#components = components
  }

  get page() {
    return this.#page || ''
  }

  get resolveComponent() {
    return this.#resolveComponent
  }

  set resolveComponent(fn) {
    this.#resolveComponent = fn
  }

  get resolveComponents() {
    return this.#resolveComponents
  }

  set resolveComponents(fn) {
    this.#resolveComponents = fn
  }

  get viewport() {
    return this.#viewport
  }

  getAssetsUrl() {
    return this.obj.getAssetsUrl()
  }

  getBaseUrl() {
    return this.obj.getBaseUrl()
  }

  getPages() {
    return this.obj.getPages()
  }

  getPreloadPages() {
    return this.obj.getPreloadPages()
  }

  getPageObject(page?: string) {
    if (!arguments.length) return this.getRoot()?.[this.page] || {}
    return page ? this.getRoot()?.[page] : {}
  }

  getRoot() {
    return this.obj.getRoot()
  }

  setPage(page?: string) {
    this.#page = page || ''
    return this
  }

  use(v: any) {
    if (v instanceof Viewport) {
      this.#viewport = v
    } else if (v && typeof v === 'object') {
      Object.entries(v).forEach(([key, value]) => {
        this.obj[key] = value
      })
    }
  }
}

export default ComponentResolver

// let page = ComponentResolver.createPage()
// let component = { style: {} }
// let original = {
//   type: 'view',
//   style: {
//     border: { style: '2' },
//     textColor: '0x03300033',
//     backgrouncColor: '0x33004455',
//   },
// } as ComponentObject

// const changes = [] as any[]
// const inverseChanges = [] as any[]

// page.components = [original]
// page.resolveComponents()

// console.log(`Result`, page.components)

// const patches = applyPatches(component, changes)
// console.log(`Result`, result)
// console.log(`Patches`, changes)
// console.log(`Inverse patches`, inverseChanges)
