import { ComponentObject } from 'noodl-types'
import curry from 'lodash/curry'
import get from 'lodash/get'
import set from 'lodash/set'
import unset from 'lodash/unset'
import pick from 'lodash/pick'
import omit from 'lodash/omit'
import has from 'lodash/has'
import mergeWith from 'lodash/mergeWith'
import update from 'lodash/update'
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
import consumers from './consumers/index'
import { consumer as c } from '../constants'
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
  consumers,
  // actions: getStore().actions as { [actionType: string]: T.StoreActionObject[] },
  // builtIns: getStore().builtIns as { [funcName: string]: T.StoreBuiltInObject[] },
  resolvers: staticResolvers as {
    [name: string]: T.StoreResolverObject
  },
  clients: new Map<string, PageMaster>(),
}

const Consumer = (function () {
  const getValueArg = ({
    prop = '',
    component,
  }: {
    component: ComponentObject
    prop: string
  }) => {
    if (!component) return
    return get(component, prop)
  }

  const o = {
    compose(...objs: T.ConsumerObject[]) {
      return (step: Step) =>
        objs.reduceRight((acc, obj) => step(acc, obj(acc)), identity)
    },
    createHOF: curry(
      <Options = any>(
        consumerOptions: Options,
        fn: any,
        step: any,
        component: ComponentObject,
      ) => step(component, fn(component, consumerOptions)),
    ),
    consume: curry(
      (
        { async, cond, type, prop, resolve }: T.ConsumerObject,
        component: ComponentObject,
      ) => {
        if (cond && !cond({ component })) return
        if (type === 'remove') {
          util.Consumer.op.remove({ key: prop, component })
        } else {
          if (async) {
            resolve?.({ component }).then((value) => {
              util.Consumer.op[type]?.({ key: prop, value, component })
            })
          } else {
            util.Consumer.op[type]?.({
              key: prop,
              value: resolve?.({
                component,
                value: getValueArg({ component, prop }),
              }),
              component,
            })
          }
        }
      },
    ),
    op: {
      morph({ key, value, component }: T.ConsumerResolveArgs) {
        if (value && typeof value === 'object') {
          mergeWith(get(component, key), value, (obj, src, key) => {
            return value
          })
        }
        const deleted = unset(component, key)
        return this
      },
      remove({ key, component }: T.ConsumerResolveArgs) {
        const deleted = unset(component, key)
        return this
      },
      rename({ key, value: renamedKey, component }: T.ConsumerResolveArgs) {
        const currentValue = get(component, key, '')
        const deleted = unset(component, key)
        set(component, renamedKey, currentValue)
        return this
      },
      replace({ key, value, component }: T.ConsumerResolveArgs) {
        set(component, key, value || '')
        return this
      },
    },
  }
  return o
})()

const Resolver = {
  compose(...fns: HOFResolverFn[]) {
    return (step: Step) => {
      return fns.reduceRight((acc, fn) => step(acc, fn(acc)), identity)
    }
  },
  createHOF: curry(
    <Options = any>(
      consumerOptions: Options,
      fn: ResolverFn,
      step: Step,
      component: ComponentObject,
    ) => step(component, fn({ ...component, ...consumerOptions })),
  ),
}

export const util = {
  Consumer,
  Resolver,
  step(acc = (...args: any[]) => {}, value: any) {
    return acc(value)
  },
}

export function identity<V>(value: V): V {
  return value
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
    viewport: pageMaster.viewport,
  }
}

const ComponentResolver = (function () {
  const _ = () => {
    const o = {
      createActionChain() {
        const actionChain = new ActionChain([] as any, {} as any, {} as any)
        return actionChain
      },
      createPage() {
        let page = new PageMaster()
        let viewport = new Viewport()

        const resolverFns = Object.values(staticResolvers).reduce(
          (acc, obj) =>
            acc.concat(
              util.Resolver.createHOF(getConsumerOptions(page))(obj.resolve),
            ),
          [],
        )
        const consumerFns = consumers.reduce(
          (acc, obj) =>
            acc.concat(util.Consumer.createHOF({})(util.Consumer.consume(obj))),
          [],
        )
        const composedResolvers = util.Resolver.compose(...resolverFns)
        const composedConsumers = util.Consumer.compose(...consumerFns)
        const transformedResolver = composedResolvers(util.step)
        const transformedConsumer = composedConsumers(util.step)

        const composeTransformedFns = (...fns) => (c) =>
          fns.reduceRight((acc, fn) => acc(fn(c)), identity)

        page.use(viewport)
        page.resolveComponent = (original: ComponentObject) => {
          return produce(
            original,
            (draft) => {
              runner.run({ component: draft, draw: transformedResolver })
            },
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
