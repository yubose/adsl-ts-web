import { ComponentObject } from 'noodl-types'
import { WritableDraft } from 'immer/dist/internal'
import produce, { applyPatches, enablePatches } from 'immer'
import ActionChain from '../ActionChain'
import getBorders from './resolvers/getBorderAttrs'
import getColors from './resolvers/getColors'
import getElementType from './resolvers/getElementType'
import { getRandomKey } from '../utils/common'
import * as T from '../types'

enablePatches()

const _store = {
  actions: {} as { [actionType: string]: T.StoreActionObject[] },
  builtIns: {} as { [funcName: string]: T.StoreBuiltInObject[] },
  resolvers: { getBorders, getColors, getElementType } as {
    [name: string]: T.StoreResolverObject
  },
  pages: new Map<string, PageMaster>(),
}

const ComponentResolver = (function () {
  const wrapResolveComponent = (fn: T.AnyFn) => {
    return (component: ComponentObject) => {
      //
    }
  }

  const _ = () => {
    const o = {
      createActionChain() {
        const actionChain = new ActionChain([] as any, {} as any, {} as any)
        return actionChain
      },
      createPage() {
        const page = new PageMaster()

        interface Pair {
          component: WritableDraft<ComponentObject>
          original: ComponentObject
        }

        interface ResolverRegisterFn {
          (component: T.NOODLComponent): (stepFn) => (acc, c) => any
        }

        interface ResolverRegisterHOF {
          (stepFn): (acc, component: T.NOODLComponent) => any
        }

        let hofResolvers: ResolverRegisterFn[] = []

        const compose = (...fns: ResolverRegisterFn[]) => (stepFn) =>
          fns.reduceRight((acc, fn) => fn(acc), stepFn)

        const step = (nextStep, component: T.NOODLComponent) =>
          nextStep(component)

        const fns = Object.values(_store.resolvers).map((o) => {
          return
        })
        const composed = compose(
          ...fns.map(
            (obj) => (stepFn) => (acc, component: T.NOODLComponent) => {
              obj.resolve(component)
              return stepFn(acc, component)
            },
          ),
        )(step)

        page.resolveComponent = (original: T.NOODLComponent) => {
          return produce(original, (draft) => {
            composed(draft)
          })
        }

        page.resolveComponents = () => {
          const actions = Object.values(_store.actions)
          const builtIns = Object.values(_store.builtIns)
          const resolvers = Object.values(_store.resolvers)
          page.components = page.components.map(page.resolveComponent)
        }

        _store.pages.set(page.id, page)
        return page
      },
      createResolver(fn: (pair: { component: any; original: any }) => any) {
        const hofResolver = createResolver(fn)
        hofResolvers.push(hofResolver)
        return hofResolver
      },
      resolveComponent: wrapResolveComponent((component: ComponentObject) => {
        //
      }),
    }

    return o
  }

  return _()
})()

class PageMaster {
  #page: string = ''
  #resolveComponent: (original: T.NOODLComponent) => any
  #resolveComponents: T.AnyFn
  #components: ComponentObject[] = []
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
    if (v && typeof v === 'object') {
      Object.entries(v).forEach(([key, value]) => {
        this.obj[key] = value
      })
    }
  }
}

export default ComponentResolver

let page = ComponentResolver.createPage()
let component = { style: {} }
let original = {
  type: 'view',
  style: {
    border: { style: '2' },
    textColor: '0x03300033',
    backgrouncColor: '0x33004455',
  },
} as T.NOODLComponent

const changes = [] as any[]
const inverseChanges = [] as any[]

page.components = [original]
page.resolveComponents()

console.log(`Result`, page.components)

// const patches = applyPatches(component, changes)
// console.log(`Result`, result)
// console.log(`Patches`, changes)
// console.log(`Inverse patches`, inverseChanges)
