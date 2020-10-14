import _ from 'lodash'
import Logger from 'logsnap'
import makeComponentResolver from './factories/makeComponentResolver'
import * as T from './types'
import * as C from './constants'
import Resolver from './Resolver'
import Viewport from './Viewport'
import Component from './Component'

class NOODL implements T.INOODLUi {
  #cb: {
    action: Partial<Record<T.EventId, Function[]>>
    builtIn: { [key: string]: Function[] }
    chaining: { [key: string]: any }
  } = {
    action: {},
    builtIn: {},
    chaining: {},
  }
  #resolver: T.ComponentResolver
  #resolvers: Resolver[] = []
  #viewport: Viewport
  initialized: boolean = false
  page: T.Page = { name: '', object: null }

  constructor({ viewport }: { viewport?: Viewport } = {}) {
    this.#resolver = makeComponentResolver({ roots: {}, viewport })
  }

  init({ log, viewport } = {}) {
    if (viewport) this.#resolver.setViewport(viewport)
    this.initialized = true
    Logger[log?.enabled ? 'enable' : 'disable']?.()
    return this
  }

  on(eventName: T.EventId, cb: Function) {
    if (_.isString(eventName)) this.#addCb(eventName, cb)
    return this
  }

  off(eventName: T.EventId, cb: Function) {
    if (_.isString(eventName)) this.#removeCb(eventName, cb)
    return this
  }

  #getCbPath = (key: T.EventId) => {
    let path = ''
    if (key in C.event.action) {
      path = 'action'
    } else if (key === C.event.action.BUILTIN) {
      path = 'action' + '.' + C.event.action.BUILTIN
    } else if (key in C.event.actionChain) {
      path = 'chaining'
    }
    return path
  }

  #addCb = (key: T.EventId, cb: Function) => {
    const path = this.#getCbPath(key)
    if (path) {
      if (!_.isArray(this.#cb[path])) this.#cb[path] = []
      this.#cb[path].push(cb)
    }
    return this
  }

  #removeCb = (key: T.EventId, cb: Function) => {
    let path = ''
    if (key in C.event.action) {
      path = 'action'
    } else if (key === C.event.action.BUILTIN) {
      path = `action.${C.event.action.BUILTIN}`
    } else if (key in C.event.actionChain) {
      path = 'chaining'
    }
    if (path) {
      if (_.isArray(this.#cb[path])) {
        if (this.#cb[path].includes(cb)) {
          this.#cb[path] = _.filter(this.#cb[path], (_cb) => _cb !== cb)
        }
      }
    }
    return this
  }

  getContext() {
    return this.#resolver?.getResolverContext()
  }

  resolveComponents(
    components: T.ComponentType | T.ComponentType[] | T.Page['object'],
  ) {
    if (components) {
      if (components instanceof Component) {
        return this.#resolve(components)
      } else if (_.isObject(components)) {
        if ('components' in components) {
          return _.map(components.components, (c) => this.#resolve(c))
        } else {
          return this.#resolve(components)
        }
      } else if (_.isArray(components)) {
        return _.map(components, (c) => this.#resolve(c))
      }
    }
    return []
  }

  setAssetsUrl(...args: Parameters<T.ComponentResolver['setAssetsUrl']>) {
    this.#resolver.setAssetsUrl(...args)
    return this
  }

  setPage(page: T.Page) {
    this.page = page || { name: '', object: null }
    this.#resolver.setPage(this.page)
    return this
  }

  setResolvers(...args: Parameters<T.ComponentResolver['setResolvers']>) {
    this.#resolver.setResolvers(...args)
    return this
  }

  setRoot(...args: Parameters<T.ComponentResolver['setRoot']>) {
    this.#resolver.setRoot(...args)
    return this
  }

  getViewport() {
    return this.#resolver.getViewport()
  }

  setViewport(...args: Parameters<T.ComponentResolver['setViewport']>) {
    this.#resolver.setViewport(...args)
    return this
  }

  use(mod: any) {
    if (mod instanceof Viewport) {
      this.#viewport = mod
    } else if (mod instanceof Resolver) {
      this.#resolvers.push(mod)
    }
    return this
  }

  unuse(mod: any) {
    return this
  }

  reset() {
    this['#resolvers'] = []
    this['initialized'] = false
    this['page'] = { name: '', object: null }
    return this
  }

  #resolve = (
    c: T.ComponentType,
    {
      id,
      resolverOptions,
    }: { id?: string; resolverOptions?: T.ResolverOptions } = {},
  ) => {
    let component: T.IComponent
    if (c instanceof Component) {
      component = c
    } else {
      component = new Component(c)
    }
    component['id'] = id || _.uniqueId()
    const page = this.#resolver.getResolverContext().page
    const consumerOptions = this.#resolver.getResolverConsumerOptions({
      component,
    })
    return this.#resolver.resolve(component)
  }
}

export default NOODL
