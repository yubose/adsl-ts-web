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
import Component from './Component'
import ListItemComponent from './ListItemComponent'
import makeRootsParser from './factories/makeRootsParser'
import {
  forEachDeepEntries,
  forEachEntries,
  formatColor,
  hasLetter,
} from './utils/common'
import ActionChain from './ActionChain'
import isReference from './utils/isReference'
import * as T from './types'

const log = Logger.create('noodl-ui')

function _createState(state?: Partial<T.INOODLUiState>): T.INOODLUiState {
  return {
    nodes: new Map(),
    lists: new Map(),
    ...state,
  } as T.INOODLUiState
}

class NOODL implements T.INOODLUi {
  #assetsUrl: string = ''
  #cb: {
    action: Partial<Record<T.ActionEventId, Function[]>>
    builtIn: T.ActionChainActionCallbackOptions['builtIn']
    chaining: Partial<Record<T.ActionChainEventId, Function[]>>
  } = {
    action: {},
    builtIn: {},
    chaining: {},
  }
  #page: T.Page = { name: '', object: null }
  #parser: T.RootsParser
  #resolvers: Resolver[] = []
  #root: { [key: string]: any } = {}
  #state: T.INOODLUiState
  #viewport: T.IViewport
  initialized: boolean = false

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

  on(eventName: T.EventId, cb: any, cb2?: any) {
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

  // getLists() {
  //   return this.#state.lists
  // }

  // getList(component: string | T.UIComponent) {
  //   if (component instanceof ListComponent) return component.getData()
  //   return findList(this.#state.lists, component)
  // }

  /**
   * Retrieves the list item from state. If a component id is passed in it will
   * attempt to retrieve the list item by comparing it to an existing component instance's id
   * that was set previously in the state. Vice versa for using instances.
   * Note: This method will always assume that the arg is a descendant of the list item
   * @param { IComponent | string } component - Component or component id
   */
  // getListItem(c: string | T.UIComponent) {
  //   let component: T.UIComponent | null = null
  //   let dataObject: any

  //   if (_.isString(c)) component = this.getNode(c)

  //   if (component) {
  //     if (component instanceof Component) {
  //       const listItemComponent = findParent(
  //         component,
  //         (parent) => parent?.noodlType === 'listItem',
  //       )
  //       if (listItemComponent) dataObject = listItemComponent.getDataObject()
  //     }
  //   }

  //   return dataObject
  // }

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
   * @param { UIComponent | string } component -
   */
  getNode(
    component: T.UIComponent | string,
    fn?: (component: T.UIComponent | null) => boolean,
  ) {
    let result: T.UIComponent | null | undefined
    if (fn === undefined) {
      if (component instanceof Component) {
        result = this.#state.nodes.get(component as T.UIComponent)
      } else if (_.isString(component)) {
        const componentId = component
        const comparator = (node: T.UIComponent) => node?.id === componentId
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

  parse(key: string | T.UIComponent): T.NOODLComponentProps | any {
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

  resolveComponents(component: T.ComponentType): T.UIComponent
  resolveComponents(components: T.ComponentType[]): T.UIComponent[]
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

  #resolve = (c: T.ComponentType) => {
    let component: T.UIComponent

    if (c instanceof Component) component = c as T.UIComponent
    else component = new Component(c) as T.UIComponent

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

    const fn = (c: T.UIComponent) => (r: T.IResolver) =>
      r.resolve(c, consumerOptions)

    const resolve = (c: T.UIComponent) => {
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

  setNode(component: T.UIComponent) {
    this.#state.nodes.set(component, component)
    return this
  }

  // setList(component: T.IListComponent, data?: any) {
  //   if (!component || !(component instanceof ListComponent)) return this
  //   if (data !== undefined) component.set('listObject', data)
  //   this.#state.lists.set(component, component)
  //   return this
  // }

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
    this.initialized = false
    return this
  }

  createSrc(path: string | T.NOODLIfObject, component?: T.UIComponent) {
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
