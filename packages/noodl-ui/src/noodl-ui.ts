import _ from 'lodash'
import Logger from 'logsnap'
import Resolver from './Resolver'
import Viewport from './Viewport'
import Component from './Component'
import makeRootsParser from './factories/makeRootsParser'
import {
  forEachDeepEntries,
  forEachEntries,
  formatColor,
  hasLetter,
} from './utils/common'
import ActionChain from './ActionChain'
import * as T from './types'
import isReference from 'utils/isReference'

const log = Logger.create('noodl-ui')

function _createState(
  state?: Partial<T.ComponentResolverState>,
): T.ComponentResolverState {
  return {
    nodes: {},
    lists: {},
    pending: {}, // Pending data used by a data consumer (ex: for list item children)
    ...state,
  } as T.ComponentResolverState
}

class NOODL implements T.INOODLUi {
  #assetsUrl: string = ''
  #cb: {
    action: Partial<Record<T.ActionEventId, Function[]>>
    builtIn: Partial<Record<string, Function[]>>
    chaining: Partial<Record<T.ActionChainEventId, Function[]>>
  } = {
    action: {},
    builtIn: {},
    chaining: {},
  }
  #parser: T.RootsParser
  #resolvers: Resolver[] = []
  #root: { [key: string]: any }
  #state: T.ComponentResolverState
  #viewport: T.IViewport
  initialized: boolean = false
  page: T.Page = { name: '', object: null }

  constructor({
    showDataKey,
    viewport,
  }: { showDataKey?: boolean; viewport?: T.IViewport } = {}) {
    this.#parser = makeRootsParser({ roots: {} })
    this.#state = _createState({ showDataKey })
    this.#viewport = viewport || new Viewport()
  }

  get assetsUrl() {
    return this.#assetsUrl
  }

  get parser() {
    return this.#parser
  }

  get viewport() {
    return this.#viewport
  }

  /**
   * Consumes data from the "pending" object using the component id as the key
   * or the component reference itself
   * @param { string | Component } component
   */
  consume(component: T.IComponent) {
    const componentId = component.id || ''
    log.func('consume')
    if (!componentId) {
      log.red('Invalid componentId used to consume list data', {
        component: component.snapshot(),
        pending: this.#state.pending,
      })
    }
    const value = this.#state.pending[componentId]
    if (value) {
      delete this.#state.pending[componentId]
    } else {
      console.groupCollapsed(
        `%c[consume] Expected data to be consumed by a component with id ` +
          `"${componentId}" but received null or undefined when attempting ` +
          `to retrieve it`,
        'color:#ec0000',
        {
          targetObject: this.#state.pending,
          expectingKey: componentId,
          consumedResult: value,
          component: component.snapshot(),
        },
      )
      console.trace()
      console.groupEnd()
    }
    return value
  }

  createActionChain(
    actions: Parameters<T.INOODLUi['createActionChain']>[0],
    {
      trigger,
      ...otherOptions
    }: Parameters<T.INOODLUi['createActionChain']>[1],
  ) {
    const options = { builtIn: this.#cb.builtIn, trigger, ...otherOptions }

    forEachEntries(this.#cb.action, (key, fn) => {
      options[key] = fn
    })

    const actionChain = new ActionChain(actions, {
      ...options,
      ..._.reduce(
        _.entries(this.#cb.action),
        (acc, [actionType, cbs]) => {
          if (_.isArray(cbs)) {
            acc[actionType] = cbs
          }
          return acc
        },
        {} as any,
      ),
    })

    // @ts-expect-error
    window.ac = actionChain
    return actionChain.build({
      context: this.getContext() as T.ResolverContext,
      parser: this.parser,
      ...otherOptions,
    })
  }

  init({ log, viewport }: Partial<Parameters<T.INOODLUi['init']>[0]> = {}) {
    if (viewport) this.setViewport(viewport)
    this.initialized = true
    Logger[log ? 'enable' : 'disable']?.()
    return this
  }

  on(eventName: T.EventId, cb, cb2) {
    if (_.isString(eventName)) this.#addCb(eventName, cb, cb2)
    return this
  }

  off(eventName: T.EventId, cb: Function) {
    if (_.isString(eventName)) this.#removeCb(eventName, cb)
    return this
  }

  emit(eventName: T.EventId, ...args: any[]) {
    if (_.isString(eventName)) {
      const path = this.#getCbPath(eventName)
      if (path) {
        let cbs = _.get(this.#cb, path) as Function[]
        if (!_.isArray(cbs)) cbs = cbs ? [cbs] : []
        _.forEach(cbs, (cb) => cb(...args))
      }
    }
    return this
  }

  #getCbPath = (key: T.EventId | 'action' | 'chaining') => {
    let path = ''
    if (key in this.#cb) {
      path = key
    } else if (key in this.#cb.action) {
      path = `action.${key}`
    } else if (key in this.#cb.builtIn) {
      path = `builtIn.${key}`
    } else if (key in this.#cb.chaining) {
      path = `chaining.${key}`
    }
    return path
  }

  #addCb = (
    key: T.EventId,
    cb: Function | string | { [key: string]: Function },
    cb2: Function,
  ) => {
    if (key === 'builtIn') {
      if (_.isString(cb)) {
        const funcName = cb
        const fn = cb2 as Function
        if (!_.isArray(this.#cb.builtIn[funcName])) {
          this.#cb.builtIn[funcName] = []
        }
        this.#cb.builtIn[funcName]?.push(fn)
      } else if (_.isPlainObject(cb)) {
        forEachEntries(cb as { [key: string]: Function }, (key, value) => {
          const funcName = key
          const fn = value
          if (!_.isArray(this.#cb.builtIn[funcName])) {
            this.#cb.builtIn[funcName] = []
          }
          if (!this.#cb.builtIn[funcName]?.includes(fn)) {
            this.#cb.builtIn[funcName]?.push(fn)
          }
        })
      }
    } else {
      const path = this.#getCbPath(key)
      if (path) {
        if (!_.isArray(this.#cb[path])) this.#cb[path] = []
        this.#cb[path].push(cb as Function)
      }
    }
    return this
  }

  #removeCb = (key: T.EventId, cb: Function) => {
    const path = this.#getCbPath(key)
    if (path) {
      const cbs = _.get(this.#cb, path)
      if (_.isArray(cbs)) {
        if (cbs.includes(cb)) {
          _.set(
            this.#cb,
            path,
            _.filter(cbs, (fn) => fn !== cb),
          )
        }
      }
    }
    return this
  }

  getBaseStyles(styles?: T.NOODLStyle) {
    return {
      ...this.#root.Style,
      position: 'absolute',
      outline: 'none',
      ...styles,
    }
  }

  getContext() {
    return {
      assetsUrl: this.assetsUrl,
      page: this.page,
      roots: this.#root,
      viewport: this.#viewport,
    } as T.ResolverContext
  }

  getResolverOptions(include?: { [key: string]: any }) {
    return {
      context: this.getContext(),
      parser: this.parser,
      resolveComponent: this.resolveComponents,
      ...this.getStateGetters(),
      ...this.getStateSetters(),
      ...include,
    } as T.ResolverOptions
  }

  getConsumerOptions(include?: { [key: string]: any }) {
    return {
      context: this.getContext(),
      createActionChain: this.createActionChain,
      createSrc: this.#createSrc,
      resolveComponent: this.resolveComponents,
      parser: this.parser,
      showDataKey: this.#state.showDataKey,
      ...this.getStateGetters(),
      ...this.getStateSetters(),
      ...include,
    } as T.ResolverConsumerOptions
  }

  getDraftedNodes() {
    return this.#state.nodes
  }

  getDraftedNode<K extends keyof T.ComponentResolverState['nodes']>(
    component: T.IComponent,
  ): T.ComponentResolverState['nodes'][K]
  getDraftedNode<K extends keyof T.ComponentResolverState['nodes']>(
    componentId: K,
  ): T.ComponentResolverState['nodes'][K]
  getDraftedNode<K extends keyof T.ComponentResolverState['nodes']>(
    component: T.IComponent | K,
  ) {
    if (component instanceof Component) {
      return this.#state.nodes[component.id as K]
    }
    return this.#state.nodes[component as K]
  }

  getList(listId: string) {
    return this.#state.lists[listId]
  }

  getListItem(listId: string, index: number, defaultValue?: any) {
    if (!listId || _.isUndefined(index)) return defaultValue
    return this.#state.lists[listId]?.[index] || defaultValue
  }

  getState() {
    return this.#state
  }

  getStateGetters() {
    return {
      consume: this.consume.bind(this),
      getList: this.getList.bind(this),
      getListItem: this.getListItem.bind(this),
      getState: this.getState.bind(this),
      getDraftedNodes: this.getDraftedNodes.bind(this),
      getDraftedNode: this.getDraftedNode.bind(this),
    }
  }

  getStateSetters() {
    return {
      setConsumerData: this.setConsumerData.bind(this),
      setDraftNode: this.setDraftNode.bind(this),
      setList: this.setList.bind(this),
    }
  }

  parse(key: string | T.IComponent): T.NOODLComponentProps | any {
    if (_.isString(key)) {
      if (isReference(key)) {
        //
      } else {
        // itemObject.name.firstName
      }
    } else if (key instanceof Component) {
      return this.getDraftedNode(key)?.toJS()
    }
  }

  resolveComponents(component: T.ComponentType): T.IComponent
  resolveComponents(components: T.ComponentType[]): T.IComponent[]
  resolveComponents(
    components: T.ComponentType | T.ComponentType[] | T.Page['object'],
  ) {
    if (components) {
      if (components instanceof Component) {
        return this.#resolve(components)
      } else if (!_.isArray(components) && _.isObject(components)) {
        if ('components' in components) {
          return _.map(components.components, (c: T.ComponentType) =>
            this.#resolve(c),
          )
        } else {
          return this.#resolve(components)
        }
      } else if (_.isArray(components)) {
        return _.map(components as T.ComponentType[], (c) => this.#resolve(c))
      }
    }
    return null
  }

  setAssetsUrl(assetsUrl: string) {
    this.#assetsUrl = assetsUrl
    return this
  }

  setPage(page: T.Page) {
    this.page = page || { name: '', object: null }
    return this
  }

  setRoot(root: string | { [key: string]: any }, value?: any) {
    if (_.isString(root)) this.#root[root] = value
    else this.#root = root
    return this
  }

  setViewport(viewport: T.IViewport) {
    this.#viewport = viewport
    return this
  }

  setConsumerData(component: T.IComponent | string, data: any) {
    if (component instanceof Component) {
      this.#state.pending[component.id as string] = data
    } else if (_.isString(component)) {
      const id = component
      if (!id) {
        log.func('setConsumerData')
        log.red(
          `Could not set data for a list data consumer because the child component's ` +
            `id was invalid`,
          { id, data },
        )
      } else {
        log.func('setConsumerData')
        log.grey(
          `Attached consumer data for child component id: ${id}`,
          this.#state.pending,
        )
        this.#state.pending[id] = data
      }
    }
    return this
  }

  setDraftNode(component: T.IComponent) {
    if (!component.id) {
      console.groupCollapsed(
        `%c[setDraftNode] Cannot set this node to nodes state because the id is invalid`,
        'color:#ec0000',
        component.snapshot(),
      )
      console.trace()
      console.groupEnd()
    } else {
      this.#state.nodes[component.id as string] = component
    }
    return this
  }

  setList(listId: string, data: any) {
    this.#state.lists[listId] = data
    return this
  }

  use(mod: T.IResolver | T.IViewport, ...rest: any[]) {
    const mods = [mod, ...rest]

    const handleMod = (m: typeof mods[number]) => {
      if (m instanceof Viewport) {
        this.#viewport = m
      } else if (m instanceof Resolver) {
        this.#resolvers.push(m)
      }
    }

    _.forEach(mods, (m) => {
      if (_.isArray(m)) _.forEach([...m, ...rest], (_m) => handleMod(_m))
      else handleMod(m)
    })

    return this
  }

  unuse(mod: T.IResolver) {
    if (mod instanceof Resolver) {
      this.#resolvers.push(mod)
    }
    return this
  }

  reset() {
    this.#cb = { action: {}, builtIn: {}, chaining: {} }
    this.#parser = makeRootsParser({ roots: {} })
    this.#resolvers = []
    this.#state = _createState()
    this.#root = {}
    this.#viewport = new Viewport()
    this['initialized'] = false
    this['page'] = { name: '', object: null }
    return this
  }

  #resolve = (c: T.ComponentType, { id }: { id?: string } = {}) => {
    let component: T.IComponent

    if (c instanceof Component) {
      component = c
    } else {
      component = new Component(c)
    }

    component['id'] = id || _.uniqueId()

    const type = component.get('type')
    const page = this.getContext().page
    const consumerOptions = this.getConsumerOptions({
      component,
    })

    if (!type) {
      log.func('#resolve')
      log.red(
        'Encountered a NOODL component without a "type"',
        component.snapshot(),
      )
    }

    if (page.name && this.parser.getLocalKey() !== page.name) {
      this.parser.setLocalKey(page.name)
    }

    this.emit('beforeResolve', component, consumerOptions)

    _.forEach(this.#resolvers, (resolver) =>
      resolver.resolve(component, consumerOptions),
    )

    this.emit('afterResolve', component, consumerOptions)

    // Finalize
    const { style } = component
    if (_.isObjectLike(style)) {
      forEachDeepEntries(style, (key, value) => {
        if (_.isString(value)) {
          if (value.startsWith('0x')) {
            component.set('style', key, formatColor(value))
          } else if (/(fontsize|borderwidth|borderradius)/i.test(key)) {
            if (!hasLetter(value)) {
              component.set('style', key, `${value}px`)
            }
          }
        }
      })
    }

    return component
  }

  #createSrc = (path: string) => {
    let src = ''
    if (path && _.isString(path)) {
      if (path && _.isString(path)) {
        if (path.startsWith('http')) {
          src = path
        } else if (path.startsWith('~/')) {
          // Should be handled by an SDK
        } else {
          src = this.assetsUrl + path
        }
      }
    }
    return src
  }
}

export default NOODL
