import { ComponentObject } from 'noodl-types'
import curry from 'lodash/curry'
import get from 'lodash/get'
import set from 'lodash/set'
import unset from 'lodash/unset'
import pick from 'lodash/pick'
import omit from 'lodash/omit'
import initial from 'lodash/initial'
import has from 'lodash/has'
import merge from 'lodash/merge'
import { WritableDraft, current } from 'immer/dist/internal'
import produce, { applyPatches, enablePatches, produceWithPatches } from 'immer'
import ActionChain from '../ActionChain'
import { getRandomKey } from '../utils/common'
import getStore from '../store'
import componentCache from '../utils/componentCache'
import Viewport from '../Viewport'
import runner from './Runner'
import consumers from './consumers/index'
import { consumer as c } from '../constants'
import * as T from '../types'
import * as resolverMap from './resolvers'
import { isObj } from '../utils/internal'

enablePatches()

interface Step {
  (acc: any, value: any): any
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
  const getArgs = ({
    prop,
    component,
    ...rest
  }: Partial<
    T.ConsumerObject & { component: ComponentObject } & { [key: string]: any }
  >) => {
    if (!component) return {} as T.ConsumerResolveArgs
    const obj = { component } as Partial<T.ConsumerResolveArgs>
    if (typeof prop !== 'string') prop = String(prop)
    if (prop.startsWith('style:')) {
      obj.key = 'style'
      obj.styleKey = prop.replace('style:', '')
      obj.value = get(component, `${obj.key}.${obj.styleKey}`)
    } else {
      obj.key = prop
      obj.value = get(component, obj.key)
    }
    return {
      ...rest,
      ...obj,
    } as T.ConsumerResolveArgs
  }

  const o = {
    compose(...objs: T.ConsumerObject[]) {
      return (step: Step) => {
        return objs.reduceRight((acc, obj) => {
          const hof = o.createHOF(obj)
          return step(acc, hof(component))
        }, identity)
      }
    },
    createHOF(obj: T.ConsumerObject) {
      return (fn: any) => (step: Step) => (v) => {
        o.consume(obj)(v)
        return step(v, fn(v))
      }
    },
    consume: curry((obj: T.ConsumerObject, component: ComponentObject) => {
      if (!component) return component

      const callOp = (opts: { obj: T.ConsumerObject; value: any }) => {
        const type = opts.obj.type || ''
        util.Consumer.op[type]?.(
          opts.value,
          getArgs({ ...opts.obj, component }),
        )
        if (typeof obj.finally === 'function') {
          obj.finally(getArgs({ ...opts.obj, component }))
        } else if (isObj(obj.finally)) {
          util.Consumer.consume(obj, component)
        }
      }

      const getArgsProps = { ...obj, component }

      if (obj.cond && !obj.cond(getArgs(getArgsProps))) return
      if (obj.type === 'remove') {
        callOp({ obj, value: undefined })
      } else {
        if (obj.async) {
          obj.resolve?.(getArgs(getArgsProps)).then((value: any) => {
            callOp({ obj, value })
          })
        } else {
          callOp({ obj, value: obj.resolve?.(getArgs(getArgsProps)) })
        }
      }
      return component
    }),
    op: {
      // Default operator -- runs when "type" is missing
      ''(returnValue: any, opts: T.ConsumerResolveArgs) {
        console.info(`DEFAULT CONSUME OP CALLED`, { returnValue, opts })
        return this
      },
      morph(
        returnValue: any,
        { key, styleKey, component }: T.ConsumerResolveArgs,
      ) {
        merge(component[key], returnValue)
        const deleted = unset(component, styleKey ? `style.${styleKey}` : key)
        return this
      },
      remove(_, { key, component }: T.ConsumerResolveArgs) {
        const deleted = unset(component, key)
        return this
      },
      rename(
        returnValue: any,
        { key, styleKey, component }: T.ConsumerResolveArgs,
      ) {
        const path = styleKey ? `style.${styleKey}` : key
        const currentValue = get(component, path, '')
        const deleted = unset(component, path)
        set(
          component,
          styleKey ? `style.${returnValue}` : returnValue,
          currentValue,
        )
        return this
      },
      replace(
        returnValue: any = '',
        { key, styleKey, component }: T.ConsumerResolveArgs,
      ) {
        const path = styleKey ? `style.${styleKey}` : key
        set(component, path, returnValue)
        return this
      },
    },
  }

  return o
})()

export const util = {
  Consumer,
  step(acc: T.AnyFn, value: any) {
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

        const composedConsumers = util.Consumer.compose(..._store.consumers)
        const transformedConsumer = composedConsumers(util.step)

        page.use(viewport)
        page.resolveComponent = (original: ComponentObject) => {
          return produce(
            original,
            (draft) => {
              runner.run({ component: draft, draw: transformedConsumer })
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
