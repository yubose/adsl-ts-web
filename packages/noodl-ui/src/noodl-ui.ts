import _ from 'lodash'
import Logger from 'logsnap'
import {
  evalIf,
  findParent,
  findNodeInMap,
  isBoolean,
  isBooleanTrue,
} from 'noodl-utils'
import Resolver from './Resolver'
import Viewport from './Viewport'
import Component from './components/Base/Base'
import ListItemComponent from './components/ListItem'
import makeRootsParser from './factories/makeRootsParser'
import {
  forEachDeepEntries,
  forEachEntries,
  formatColor,
  hasLetter,
} from './utils/common'
import createComponent from './utils/createComponent'
import ActionChain from './ActionChain/ActionChain'
import isReference from './utils/isReference'
import { componentEventMap, componentEventTypes } from './constants'
import * as T from './types'

const log = Logger.create('noodl-ui')

function _createState(state?: Partial<T.INOODLUiState>): T.INOODLUiState {
  return {
    nodes: new Map(),
    lists: new Map(),
    ...state,
  } as T.INOODLUiState
}

class NOODL<N = any> implements T.INOODLUi {
  #assetsUrl: string = ''
  #cb: {
    action: Partial<Record<T.ActionEventId, Function[]>>
    builtIn: T.ActionChainActionCallbackOptions['builtIn']
    chaining: Partial<Record<T.ActionChainEventId, Function[]>>
    component: Record<
      T.NOODLComponentType | 'all',
      T.NOODLComponentResolveEventCallback<N>[]
    >
  } = {
    action: {},
    builtIn: {},
    chaining: {},
    component: _.reduce(
      componentEventTypes,
      (acc, id) => _.assign(acc, { [id]: [] }),
      {} as Record<
        T.NOODLComponentType | 'all',
        T.NOODLComponentResolveEventCallback<N>[]
      >,
    ),
  }
  #page: T.Page = { name: '', object: null }
  #parser: T.RootsParser
  #resolvers: Resolver[] = []
  #root: { [key: string]: any } = {}
  #state: T.INOODLUiState
  #viewport: T.IViewport
  createNode:
    | ((
        noodlComponent: T.IComponentTypeObject,
        component: T.IComponentTypeInstance,
      ) => N)
    | undefined
  initialized: boolean = false

  constructor({
    createNode,
    showDataKey,
    viewport,
  }: {
    createNode?: NOODL['createNode']
    showDataKey?: boolean
    viewport?: T.IViewport
  } = {}) {
    this['createNode'] = createNode
    this.#parser = makeRootsParser({ roots: {} })
    this.#state = _createState({ showDataKey })
    this.#viewport = viewport || new Viewport()
  }

  get assetsUrl() {
    return this.#assetsUrl
  }

  get page() {
    return this.#page
  }

  get parser() {
    return this.#parser
  }

  get root() {
    return this.#root
  }

  get viewport() {
    return this.#viewport
  }

  resolveComponents(component: T.IComponentType): T.IComponentTypeInstance
  resolveComponents(components: T.IComponentType[]): T.IComponentTypeInstance[]
  resolveComponents(
    components: T.IComponentType | T.IComponentType[] | T.Page['object'],
  ) {
    if (components) {
      if (components instanceof Component) {
        return this.#resolve(components)
      } else if (!_.isArray(components) && _.isObject(components)) {
        if ('components' in components) {
          return _.map(components.components, (c: T.IComponentType) =>
            this.#resolve(c),
          )
        } else {
          return this.#resolve(components)
        }
      } else if (_.isArray(components)) {
        return _.map(components as T.IComponentType[], (c) => this.#resolve(c))
      }
    }
    return null
  }

  // Temporarily here for debugging purposes
  getCbs() {
    return this.#cb
  }

  #resolve = (c: T.IComponentType) => {
    let component: T.IComponentTypeInstance
    let node: N | undefined

    if (c instanceof Component) component = c as T.IComponentTypeInstance
    else component = createComponent(c)

    node = this.createNode?.(component.original, component)

    this.emit(componentEventMap[component.noodlType], node, component)

    const { id, type } = component
    const consumerOptions = this.getConsumerOptions({ component })

    if (!id) component['id'] = _.uniqueId()
    if (!type) {
      log.func('#resolve')
      log.red(
        'Encountered a NOODL component without a "type"',
        component.snapshot(),
      )
    }

    if (this.page && this.parser.getLocalKey() !== this.page.name) {
      this.parser.setLocalKey(this.page.name)
    }

    this.emit('beforeResolve', component, consumerOptions)

    const fn = (c: T.IComponentTypeInstance) => (r: T.IResolver) =>
      r.resolve(c, consumerOptions)

    const resolve = (c: T.IComponentTypeInstance) => {
      _.forEach(this.#resolvers, fn(c))
      // if (c.length) _.forEach(c.children(), resolve)
    }

    resolve(component)

    this.emit('afterResolve', component, consumerOptions)

    // Finalizing
    const { style } = component
    if (_.isObject(style)) {
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

    if (!this.#state.nodes.has(component)) {
      this.#state.nodes.set(component, component)
    }

    return component
  }

  on(eventName: T.EventId, cb: T.NOODLComponentResolveEventCallback<N>) {
    if (_.isString(eventName)) this.#addCb(eventName, cb)
    return this
  }

  off(eventName: T.EventId, cb: T.NOODLComponentResolveEventCallback<N>) {
    if (_.isString(eventName)) this.#removeCb(eventName, cb)
    return this
  }

  emit(
    eventName: T.EventId,
    ...args: Parameters<T.NOODLComponentResolveEventCallback<N>>
  ) {
    if (_.isString(eventName)) {
      const path = this.#getCbPath(eventName)
      if (path) {
        let cbs = _.get(this.#cb, path) as Function[]
        console.info(cbs)
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
    } else if (componentEventMap[key]) {
      path = `component.${key}`
    }
    return path
  }

  #addCb = (
    key: T.EventId,
    cb:
      | T.NOODLComponentResolveEventCallback<N>
      | string
      | { [key: string]: T.NOODLComponentResolveEventCallback<N> },
    cb2?: T.NOODLComponentResolveEventCallback<N>,
  ) => {
    if (key === 'builtIn') {
      if (_.isString(cb)) {
        const funcName = cb
        const fn = cb2 as T.NOODLComponentResolveEventCallback<N>
        if (!_.isArray(this.#cb.builtIn[funcName])) {
          this.#cb.builtIn[funcName] = []
        }
        this.#cb.builtIn[funcName]?.push(fn)
      } else if (_.isPlainObject(cb)) {
        forEachEntries(
          cb as { [key: string]: T.NOODLComponentResolveEventCallback<N> },
          (key, value) => {
            const funcName = key
            const fn = value
            if (!_.isArray(this.#cb.builtIn[funcName])) {
              this.#cb.builtIn[funcName] = []
            }
            if (!this.#cb.builtIn[funcName]?.includes(fn)) {
              this.#cb.builtIn[funcName]?.push(fn)
            }
          },
        )
      }
    } else {
      const path = this.#getCbPath(key)
      console.info({ path, key })
      if (path) {
        if (!_.isArray(this.#cb[path])) this.#cb[path] = []
        console.info(this.#cb)
        this.#cb[path].push(cb as T.NOODLComponentResolveEventCallback<N>)
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

  createActionChain(
    actions: Parameters<T.INOODLUi['createActionChain']>[0],
    options: Parameters<T.INOODLUi['createActionChain']>[1],
  ) {
    const actionChain = new ActionChain(actions, {
      builtIn: this.#cb.builtIn,
      ...options,
      ..._.reduce(
        _.entries(this.#cb.action),
        (acc, [actionType, cbs]) =>
          _.isArray(cbs) ? _.assign(acc, { [actionType]: cbs }) : acc,
        {} as any,
      ),
    } as T.ActionChainCallbackOptions)

    // @ts-expect-error
    window.ac = actionChain

    return actionChain.build({
      context: this.getContext() as T.ResolverContext,
      parser: this.parser,
      ...options,
    })
  }

  init({ log, viewport }: Partial<Parameters<T.INOODLUi['init']>[0]> = {}) {
    if (viewport) this.setViewport(viewport)
    this.initialized = true
    Logger[log ? 'enable' : 'disable']?.()
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
      page: this.#root[this.#page.name],
      roots: this.#root,
      viewport: this.#viewport,
    } as T.ResolverContext
  }

  getStateHelpers() {
    return {
      ...this.getStateGetters(),
      ...this.getStateSetters(),
    }
  }

  getResolverOptions(include?: { [key: string]: any }) {
    return {
      context: this.getContext(),
      parser: this.parser,
      resolveComponent: this.resolveComponents.bind(this),
      ...this.getStateGetters(),
      ...this.getStateSetters(),
      ...include,
    } as T.ResolverOptions
  }

  getConsumerOptions(include?: { [key: string]: any }) {
    return {
      context: this.getContext(),
      createActionChain: this.createActionChain.bind(this),
      createSrc: this.createSrc.bind(this),
      resolveComponent: this.resolveComponents.bind(this),
      parser: this.parser,
      showDataKey: this.#state.showDataKey,
      ...this.getStateGetters(),
      ...this.getStateSetters(),
      ...include,
    } as T.ConsumerOptions
  }

  getNodes() {
    return this.#state.nodes
  }

  /**
   * Retrieves a node stored internally when resolving the components.
   * If a string is passed, the id will be used to grab a component with that id.
   * If a component instance is used, it will be directly used to grab a component
   * by strict equality.
   * If a comparator function is passed, it will instead use the comparator to run
   * through the map of nodes. If a comparator returns true, the node in that iteration
   * will become the returned result
   * @param { IComponentTypeInstance | string } component -
   */
  getNode(
    component: T.IComponentTypeInstance | string,
    fn?: (component: T.IComponentTypeInstance | null) => boolean,
  ) {
    let result: T.IComponentTypeInstance | null | undefined
    if (fn === undefined) {
      if (component instanceof Component) {
        result = this.#state.nodes.get(component as T.IComponentTypeInstance)
      } else if (_.isString(component)) {
        const componentId = component
        const comparator = (node: T.IComponentTypeInstance) =>
          node?.id === componentId
        result = findNodeInMap(this.#state.nodes, comparator)
      }
    } else {
      result = findNodeInMap(this.#state.nodes, fn)
    }
    return result || null
  }

  getState() {
    return this.#state
  }

  getStateGetters() {
    return {
      getState: this.getState.bind(this),
      getNodes: this.getNodes.bind(this),
      getNode: this.getNode.bind(this),
    }
  }

  getStateSetters() {
    return {
      setNode: this.setNode.bind(this),
    }
  }

  parse(key: string | T.IComponentTypeInstance): T.NOODLComponentProps | any {
    if (_.isString(key)) {
      if (isReference(key)) {
        //
      } else {
        // itemObject.name.firstName
      }
    } else if (key instanceof Component) {
      return this.getNode(key)?.toJS()
    }
  }

  setAssetsUrl(assetsUrl: string) {
    this.#assetsUrl = assetsUrl
    return this
  }

  setPage(pageName: string) {
    this.#page.name = pageName
    this.#page.object = this.#root[pageName]
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

  setNode(component: T.IComponentTypeInstance) {
    this.#state.nodes.set(component, component)
    return this
  }

  use(mod: T.IResolver | T.IResolver[] | T.IViewport, ...rest: any[]) {
    const mods = (_.isArray(mod) ? mod : [mod]).concat(rest)

    const handleMod = (m: typeof mods[number]) => {
      if (m instanceof Viewport) {
        this.setViewport(m)
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
      if (mod.internal) {
        throw new Error('Internal resolvers cannot be removed')
      }
      if (this.#resolvers.includes(mod)) {
        this.#resolvers = _.filter(this.#resolvers, (r) => r !== mod)
      }
    }
    return this
  }

  reset() {
    this.#root = {}
    this.#parser = makeRootsParser({ roots: this.#root })
    this.#state = _createState()
    this.initialized = false
    return this
  }

  createSrc(
    path: string | T.NOODLIfObject,
    component?: T.IComponentTypeInstance,
  ) {
    let src = ''
    if (path) {
      if (!_.isString(path) && _.isPlainObject(path)) {
        const [valEvaluating, valOnTrue, valOnFalse] = path?.if || []
        if (_.isString(valEvaluating)) {
          const { page, roots } = this.getContext() || {}
          /**
           * Attempt #1 --> Find on root
           * Attempt #2 --> Find on local root
           * Attempt #3 --> Find on list data
           */
          path = evalIf((valEvaluating) => {
            let val
            if (_.has(roots, valEvaluating)) {
              val = _.get(roots, valEvaluating)
            } else if (_.has(page?.object, valEvaluating)) {
              val = _.get(page?.object, valEvaluating)
            } else if (component) {
              // TODO - Check on iteratorVar
              // Assuming this is for list items if the code gets here
              // At this moment we are working with the value of
              // a dataObject that is set on list item components
              const parent = findParent(
                component,
                (p) => p.noodlType === 'listItem',
              ) as ListItemComponent
              const dataObject = parent?.getDataObject?.()
              if (dataObject) {
                val = _.get(
                  dataObject,
                  _.get(
                    dataObject,
                    valEvaluating.startsWith(parent.iteratorVar)
                      ? valEvaluating.split('.').slice(1)
                      : valEvaluating,
                  ),
                )
              }
            }
            return isBoolean(val) ? isBooleanTrue(val) : !!val
          }, path)
        }
      }
      if (_.isString(path)) {
        if (/^(http|blob)/i.test(path)) {
          src = path
        } else if (path.startsWith('~/')) {
          // Should be handled by an SDK
        } else {
          src = this.assetsUrl + path
        }
      } else {
        // log
      }
    }
    return src
  }
}

export default NOODL
