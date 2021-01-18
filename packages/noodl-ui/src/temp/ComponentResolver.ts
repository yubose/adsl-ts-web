import { ComponentObject } from 'noodl-types'
import curry from 'lodash/curry'
import pick from 'lodash/pick'
import omit from 'lodash/omit'
import { WritableDraft, current } from 'immer/dist/internal'
import produce, { applyPatches, enablePatches, produceWithPatches } from 'immer'
import ActionChain from '../ActionChain'
import { getRandomKey } from '../utils/common'
import getStore from '../store'
import componentCache from '../utils/componentCache'
import Viewport from '../Viewport'
import runner from './Runner'
import EmitAction from '../Action/EmitAction'
import Action from '../Action'
import * as T from '../types'
import * as resolverMap from './resolvers'

enablePatches()

interface State {
  actions: {
    active: { [id: string]: Action | EmitAction<any> }
    aborted: { [id: string]: Action | EmitAction<any> }
    running: { [id: string]: Action | EmitAction<any> }
  }
  actionChains: {
    active: { [id: string]: ActionChain }
    aborted: { [id: string]: ActionChain }
    running: { [id: string]: ActionChain }
  }
  clients: {
    root: PageMaster
  } & { [id: string]: PageMaster }
}

interface HOFResolverFn {
  (step: Step): (acc: any, component: ComponentObject) => ComponentObject[]
}

interface ResolverFn {
  (component: WritableDraft<ComponentObject>, consumerOptions?: any): void
}

interface Step {
  (acc: any, reducer: any): any
}

export const dataResolverKeys = ['getDataAttrs', 'getEventHandlers'] as const
export const dataResolvers = pick(resolverMap, dataResolverKeys)
export const staticResolvers = omit(resolverMap, dataResolverKeys)

export const _store = {
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
  clients: new Map<string, PageMaster>(),
}

function getState() {
  return {}
}

export function composeResolvers(...fns: HOFResolverFn[]) {
  return (step: Step) => {
    return fns.reduceRight((acc, fn) => step(acc, fn(acc)), identity)
  }
}

export const createResolverHOF = curry(
  <Options = any>(
    consumerOptions: Options,
    fn: ResolverFn,
    step: Step,
    component: ComponentObject,
  ) => step(component, fn(component, consumerOptions)),
)

export function identity<V>(value: V): V {
  return value
}

export function step(acc: any = () => {}, component: any) {
  return acc(component)
}

export function prop<O, Key extends keyof O>(name: Key) {
  return (obj: O) => obj && typeof obj === 'object' && obj[name]
}

export function values<O, K extends keyof O>(obj: O): O[K][] {
  return Object.values(obj)
}

export function getConsumerOptions(pageMaster: PageMaster) {
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
    getState,
    viewport: pageMaster.viewport,
  }
}

const ComponentResolver = (function () {
  const _ = () => {
    const o = {
      consume: curry(
        (component: ComponentObject, prop: string, value?: unknown) => {
          if (prop) {
            if (typeof value === 'boolean') {
              //
            } else if (typeof value === 'function') {
              //
            } else if (typeof value === 'number') {
              //
            } else if (value && typeof value === 'object') {
              //
            } else if (typeof value === 'string') {
              //
            } else if (value == null) {
              //
            }
          }
        },
      ),
      createActionChain() {
        const actionChain = new ActionChain([] as any, {} as any, {} as any)
        return actionChain
      },
      createPage() {
        let page = new PageMaster()
        let viewport = new Viewport()

        const resolverFns = values(staticResolvers).reduce(
          (acc, obj) =>
            acc.concat(
              createResolverHOF(getConsumerOptions(page))(obj.resolve),
            ),
          [],
        )
        const composedResolvers = composeResolvers(...resolverFns)
        const transform = composedResolvers(step)

        page.use(viewport)
        page.resolveComponent = (original: ComponentObject) => {
          return produce(
            original,
            (draft) => void runner.run(draft, transform),
            (patches) => void console.info(patches),
          )
        }

        page.resolveComponents = () => {
          return (page.components = page.components.map(page.resolveComponent))
        }

        _store.clients.set(page.id, page)
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
    this.id = _store.clients.size ? getRandomKey() : 'root'
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
