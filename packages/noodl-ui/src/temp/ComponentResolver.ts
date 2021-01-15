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
  interface Pair {
    component: WritableDraft<ComponentObject>
    original: ComponentObject
  }

  interface ResolverRegisterFn {
    (pair: Pair): (stepFn: ResolverRegisterStepFn) => (pair: Pair) => Pair
  }

  interface ResolverRegisterStepFn {
    (pair: Pair, fn: ResolverRegisterFn): ResolverRegisterStepFn
  }

  interface ResolverRegisterHOF {
    (stepFn: ResolverRegisterStepFn): ResolverRegisterStepFn
  }

  let hofResolvers: ResolverRegisterHOF[] = []

  const compose = (...fns: ResolverRegisterFn[]) => (
    stepFn: ResolverRegisterStepFn,
  ) => fns.reduceRight((acc, fn) => fn(acc), stepFn)

  const createResolver = (fn: ResolverRegisterFn) => (
    stepFn: ResolverRegisterStepFn,
  ): ResolverRegisterStepFn => (acc, pair) => stepFn(acc, fn(pair))

  const step = (nextStep: ResolverRegisterStepFn, pair: Pair) => nextStep(pair)

  const composed = compose(...hofResolvers)
  const runResolvers = composed(step)

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
        page.resolveComponents = () => {
          const actions = Object.values(_store.actions)
          const builtIns = Object.values(_store.builtIns)
          const resolvers = Object.values(_store.resolvers)

          const runResolvers = (
            pair: {
              component: WritableDraft<ComponentObject>
              original: ComponentObject
            },
            consumerOptions?: any,
          ) => {
            for (let i = 0; i < resolvers.length; i++) {
              const resolver = resolvers[i]
              resolver.resolve(pair, consumerOptions)
            }
          }

          const run = (pair: {
            component: WritableDraft<ComponentObject>
            original: ComponentObject
          }) => {
            runResolvers(pair)
            if (Array.isArray(pair.component.children)) {
              const numChildren = pair.component.children.length
              for (let i = 0; i < numChildren; i++) {
                const child = pair.component.children[i]
                const newPair = { component: child }
                runResolvers
              }
            }
          }

          const nextComponents = page.components.map((original) =>
            produce(original, (draft) => {
              runResolvers({ component: draft, original })
              if (Array.isArray(original.children)) {
              }
            }),
          )

          page.components = nextComponents
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
}

const changes = [] as any[]
const inverseChanges = [] as any[]

const result = produce(
  component,
  (draft) => {
    for (let resolver of Object.values(_store.resolvers)) {
      resolver.resolve({ component: draft, original })
    }
  },
  (patches, inversePatches) => {
    changes.push(...patches)
    inversePatches.push(...inversePatches)
  },
)

// const patches = applyPatches(component, changes)
// console.log(`Result`, result)
// console.log(`Patches`, changes)
// console.log(`Inverse patches`, inverseChanges)
