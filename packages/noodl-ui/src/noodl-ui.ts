import _ from 'lodash'
import { isDraft, original } from 'immer'
import Logger from 'logsnap'
import {
  evalIf,
  findParent,
  findNodeInMap,
  isBoolean as isNOODLBoolean,
  isBooleanTrue,
  isEmitObj,
} from 'noodl-utils'
import Resolver from './Resolver'
import Viewport from './Viewport'
import Component from './components/Base'
import _internalResolver from './resolvers/_internal'
import makeRootsParser from './factories/makeRootsParser'
import {
  forEachDeepEntries,
  forEachEntries,
  formatColor,
  getRandomKey,
  hasLetter,
} from './utils/common'
import { isActionChainEmitTrigger } from './utils/noodl'
import createComponent from './utils/createComponent'
import Action from './Action'
import ActionChain from './ActionChain'
import { event } from './constants'
import * as T from './types'
import EmitAction from './Action/EmitAction'

const log = Logger.create('noodl-ui')

function _createState(state?: Partial<T.INOODLUiState>): T.INOODLUiState {
  return {
    nodes: new Map(),
    page: '',
    ...state,
  } as T.INOODLUiState
}

class NOODL implements T.INOODLUi {
  #assetsUrl: string = ''
  #cb: {
    action: Partial<
      Record<T.NOODLActionType, T.IActionChainUseObjectBase<any>[]>
    >
    builtIn: { [funcName: string]: T.ActionChainActionCallback[] }
    chaining: Partial<Record<T.ActionChainEventId, Function[]>>
  } = {
    action: {},
    builtIn: {},
    chaining: _.reduce(
      _.values(event.actionChain),
      (acc, key) => _.assign(acc, { [key]: [] }),
      {},
    ),
  }
  #parser: T.RootsParser
  #resolvers: Resolver[] = []
  #root: { [key: string]: any } = {}
  #state: T.INOODLUiState
  #viewport: T.IViewport
  actionsContext: any = {}
  initialized: boolean = false

  constructor({
    showDataKey,
    viewport,
  }: {
    showDataKey?: boolean
    viewport?: T.IViewport
  } = {}) {
    this.#parser = makeRootsParser({ roots: {} })
    this.#state = _createState({ showDataKey })
    this.#viewport = viewport || new Viewport()
  }

  get assetsUrl() {
    return this.#assetsUrl
  }

  get page() {
    return this.#state.page
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
    componentsParams: T.IComponentType | T.IComponentType[] | T.Page['object'],
  ) {
    let components: any[] = []
    let resolvedComponents: T.IComponentTypeInstance[] = []

    if (componentsParams) {
      if (componentsParams instanceof Component) {
        components = [componentsParams]
      } else if (!_.isArray(componentsParams) && _.isObject(componentsParams)) {
        if ('components' in componentsParams) {
          components = componentsParams.components
        } else {
          components = [componentsParams]
        }
      } else if (_.isArray(componentsParams)) {
        components = componentsParams
      } else if (_.isString(componentsParams)) {
        components = [componentsParams]
      }
    }

    // Finish off with the internal resolvers to handle the children
    _.forEach(components, (c) => {
      const component = this.#resolve(c)
      _internalResolver.resolve(
        component,
        this.getConsumerOptions({ component }),
      )
      resolvedComponents.push(component)
    })

    return _.isArray(componentsParams)
      ? resolvedComponents
      : resolvedComponents[0]
  }

  #resolve = (
    c: T.NOODLComponentType | T.IComponentTypeInstance | T.IComponentTypeObject,
  ) => {
    const component = createComponent(c)
    const consumerOptions = this.getConsumerOptions({ component })
    const baseStyles = this.getBaseStyles(component.original.style)

    if (!component.id) component.id = getRandomKey()

    component.assignStyles(baseStyles)

    if (this.parser.getLocalKey() !== this.page) {
      this.parser.setLocalKey(this.page)
    }

    // Finalizing
    if (_.isObject(component.style)) {
      forEachDeepEntries(component.style, (key, value: string) => {
        if (_.isString(value)) {
          if (value.startsWith('0x')) {
            component.set('style', key, formatColor(value))
          } else if (/(fontsize|borderwidth|borderradius)/i.test(key)) {
            if (!hasLetter(value)) component.set('style', key, `${value}px`)
          }
        }
      })
    }

    if (!this.#state.nodes.has(component)) {
      // this.#state.nodes.set(component.id, component)
    }

    _.forEach(this.#resolvers, (r: T.IResolver) =>
      r.resolve(component, consumerOptions),
    )

    this.emit('afterResolve', component, consumerOptions)

    return component
  }

  on(
    eventName: T.EventId,
    cb: (
      noodlComponent: T.IComponentTypeObject,
      args: {
        component: T.IComponentTypeInstance
        parent: T.IComponentTypeInstance | null
      },
    ) => void,
  ) {
    if (_.isString(eventName)) this.#addCb(eventName, cb)
    return this
  }

  off(eventName: T.EventId, cb: T.INOODLUiComponentEventCallback<any>) {
    if (_.isString(eventName)) this.#removeCb(eventName, cb)
    return this
  }

  // emit(eventName: T.NOODLComponentEventId, cb: T.INOODLUiComponentEventCallback): void
  emit(
    eventName: T.EventId,
    ...args: Parameters<T.INOODLUiComponentEventCallback<any>>
  ) {
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
    if (key === 'all') {
      path = 'component.all'
    } else if (key in this.#cb) {
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

  // Temp here for debugging
  getCbs() {
    return this.#cb
  }

  #addCb = (
    key: T.IAction | T.EventId,
    cb:
      | T.INOODLUiComponentEventCallback<any>
      | string
      | { [key: string]: T.INOODLUiComponentEventCallback<any> },
    cb2?: T.INOODLUiComponentEventCallback<any>,
  ) => {
    if (key instanceof Action) {
      if (!_.isArray(this.#cb.action[key.actionType])) {
        this.#cb.action[key.actionType] = []
      }
      this.#cb.action[key.actionType].push(key)
    } else if (key === 'builtIn') {
      if (_.isString(cb)) {
        const funcName = cb
        const fn = cb2 as T.INOODLUiComponentEventCallback<any>
        if (!_.isArray(this.#cb.builtIn[funcName])) {
          this.#cb.builtIn[funcName] = []
        }
        this.#cb.builtIn[funcName]?.push(fn)
      } else if (_.isPlainObject(cb)) {
        forEachEntries(
          cb as { [key: string]: T.INOODLUiComponentEventCallback<any> },
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
      if (path) {
        if (!_.isArray(this.#cb[path])) this.#cb[path] = []
        this.#cb[path].push(cb as T.INOODLUiComponentEventCallback<any>)
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

  createActionChainHandler(
    actions: T.IActionObject[],
    options: {
      component: T.IComponentTypeInstance
      trigger: T.IActionChainEmitTrigger
    },
  ) {
    const actionChain = new ActionChain(
      _.isArray(actions) ? actions : [actions],
      {
        component: options.component,
        pageName: this.page,
        pageObject: this.getPageObject(this.page),
        trigger: options.trigger,
      },
    )
    const useActionObjects = _.reduce(
      _.entries(this.#cb.action),
      (arr, [actionType, actionObjs]) =>
        arr.concat(
          _.reduce(
            actionObjs || [],
            (
              acc,
              actionObj: Omit<T.IActionChainUseObjectBase<any>, 'actionType'>,
            ) => {
              if (actionType === 'emit' || 'emit' in (actionObj || {})) {
                // Only accept the emit action handlers where their
                // actions only exist in action chains
                if (isActionChainEmitTrigger(actionObj.trigger)) {
                  return acc.concat({ actionType: 'emit', ...actionObj })
                }
              }
              return acc.concat({ actionType, ...actionObj } as any)
            },
            [] as T.IActionChainUseObjectBase<any>[],
          ),
        ),
      [] as any[],
    )
    actionChain.useAction(useActionObjects).useBuiltIn(
      _.map(_.entries(this.#cb.builtIn), ([funcName, fn]) => ({
        funcName,
        fn,
      })),
    )

    // @ts-expect-error
    if (!window.ac) window['ac'] = {}
    // @ts-expect-error
    window.ac[options.component?.id || ''] = actionChain

    const buildOptions: T.IActionChainBuildOptions = {
      context: this.getContext(),
      parser: this.#parser,
      trigger: options.trigger,
    }

    return actionChain.build(buildOptions)
  }

  init({
    actionsContext,
    viewport,
  }: { actionsContext?: any } & Partial<
    Parameters<T.INOODLUi['init']>[0]
  > = {}) {
    if (viewport) this.setViewport(viewport)
    this.initialized = true
    this['actionsContext'] = actionsContext
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

  getPageObject(page: string) {
    return this.#root[page]
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
      resolveComponent: this.#resolve.bind(this),
      ...this.getStateGetters(),
      ...this.getStateSetters(),
      ...include,
    } as T.ResolverOptions
  }

  getConsumerOptions({
    component,
    ...rest
  }: {
    component: T.IComponentTypeInstance
    [key: string]: any
  }) {
    return {
      component,
      context: this.getContext(),
      createActionChainHandler: (
        ...[action, options]: Parameters<T.INOODLUi['createActionChainHandler']>
      ) => this.createActionChainHandler(action, { ...options, component }),
      createSrc: (path: string) => this.createSrc(path, component),
      resolveComponent: this.#resolve.bind(this),
      parser: this.parser,
      showDataKey: this.#state.showDataKey,
      ...this.getStateGetters(),
      ...this.getStateSetters(),
      ...rest,
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

  getResolvers() {
    return this.#resolvers.map((resolver) => resolver.resolve)
  }

  getState() {
    return this.#state
  }

  getStateGetters() {
    return {
      getNodes: this.getNodes.bind(this),
      getNode: this.getNode.bind(this),
      getPageObject: this.getPageObject.bind(this),
      getState: this.getState.bind(this),
    }
  }

  getStateSetters() {
    return {
      setNode: this.setNode.bind(this),
    }
  }

  setAssetsUrl(assetsUrl: string) {
    this.#assetsUrl = assetsUrl
    return this
  }

  setPage(pageName: string) {
    this.#state['page'] = pageName
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

  use(resolver: T.IResolver | T.IResolver[]): this
  use(action: T.IActionChainUseObject | T.IActionChainUseObject[]): this
  use(viewport: T.IViewport): this
  use(
    mod:
      | T.IResolver
      | T.IActionChainUseObject
      | T.IViewport
      | (T.IResolver | T.IActionChainUseObject)[],
    ...rest: any[]
  ) {
    const mods = (_.isArray(mod) ? mod : [mod]).concat(rest)
    const handleMod = (m: typeof mods[number]) => {
      if (m) {
        if ('funcName' in m) {
          if (!_.isArray(this.#cb.builtIn[m.funcName])) {
            this.#cb.builtIn[m.funcName] = []
          }
          this.#cb.builtIn[m.funcName].push(
            ...(_.isArray(m.fn) ? m.fn : [m.fn]),
          )
        } else if ('actionType' in m) {
          if (!_.isArray(this.#cb.action[m.actionType])) {
            this.#cb.action[m.actionType] = []
          }
          const obj = { actionType: m.actionType, fn: m.fn } as any
          if ('context' in m) obj['context'] = m.context
          if ('trigger' in m) obj['trigger'] = m.trigger
          this.#cb.action[m.actionType]?.push(obj)
        } else if (m instanceof Viewport) {
          this.setViewport(m)
        } else if (m instanceof Resolver) {
          this.#resolvers.push(m)
        }
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
    this.#cb = { action: [], builtIn: [], chaining: [] }
    return this
  }

  createSrc(
    path: string | T.EmitActionObject | T.IfObject,
    component?: T.IComponentTypeInstance,
  ) {
    log.func('createSrc')
    if (isDraft(path)) path = original(path) as typeof path

    const resolvePath = (pathValue: string) => {
      let src = ''
      if (_.isString(pathValue)) {
        if (/^(http|blob)/i.test(pathValue)) {
          src = pathValue
        } else if (pathValue.startsWith('~/')) {
          // Should be handled by an SDK
        } else {
          src = this.assetsUrl + pathValue
        }
      } else {
        // log
        src = `${this.assetsUrl}${pathValue}`
      }
      return src
    }

    if (path) {
      // Plain strings
      if (_.isString(path)) {
        return resolvePath(path)
      }
      // "If" object evaluation
      else if (path.if) {
        path = evalIf((val: any) => {
          if (isNOODLBoolean(val)) return isBooleanTrue(val)
          if (typeof val === 'function') {
            if (component) {
              let listItem: T.IListItem
              if (component.noodlType !== 'listItem') {
                listItem = findParent(
                  component,
                  (p: T.IComponentTypeInstance) => !!p.getDataObject?.(),
                )
              } else {
                listItem = component
              }
              if (listItem) return val(listItem.getDataObject())
            } else {
              return val()
            }
          }
          return !!val
        }, path)
        return resolvePath(path)
      }
      // Emit object evaluation
      else if (isEmitObj<T.EmitActionObject>(path)) {
        // const emitAction = new EmitAction(
        //   (isDraft(path) ? original(path) : path) as NonNullable<any>,
        //   { trigger: 'path' },
        // )
        // TODO - narrow this query to avoid only using the first encountered obj
        const obj = this.#cb.action.emit?.find?.((o) => o?.trigger === 'path')
        const fn = obj?.fn
        if (typeof fn === 'function') {
          // const emitAction = new EmitAction(path, { trigger: 'path' })
          // emitAction.callback = async (...args: any[]) => {
          //   const result = await Promise.resolve(fn(...args))
          //   return result
          // }

          let result = fn(
            {
              ...this.getConsumerOptions({ component } as any),
              pageName: this.page,
              path,
              component,
            },
            this.actionsContext,
          )

          if (result instanceof Promise) {
            return result
              .then((res) => {
                console.info('result: ', resolvePath(res))
                return resolvePath(res)
              })
              .catch((err) => {
                throw new Error(err)
              })
          } else {
            console.info('result from aaaa: ', emitAction.result)
            return resolvePath(result)
          }
        }
      }
      // Assuming we are passing in a dataObject
      else if (_.isFunction(path)) {
        if (component) {
          let dataObject: any
          // Assuming it is a component retrieving its value from a dataObject
          if (component.get?.('iteratorVar')) {
            let listItem: T.IListItem
            if (component.noodlType !== 'listItem') {
              listItem = findParent(
                component,
                (p: any) => p?.noodlType === 'listItem',
              )
            } else {
              listItem = component
            }
            if (listItem) {
              dataObject = listItem.getDataObject()
              path = evalIf((fn, val1, val2) => {
                const result = fn(dataObject)
                if (result) {
                  console.info(
                    `Result of path "if" func is truthy. Returning: ${val1}`,
                    {
                      component,
                      dataObject,
                      if: path.if,
                      valOnTrue: val1,
                      valOnFalse: val2,
                    },
                  )
                } else {
                  console.info(
                    `Result of path "if" func is falsey. Returning: ${val2}`,
                    {
                      component,
                      dataObject,
                      if: path.if,
                      valOnTrue: val1,
                      valOnFalse: val2,
                    },
                  )
                }
                return result
              }, path)
            } else {
              log.red(
                `No listItem parent was found for a dataObject consumer using iteratorVar "${component.get(
                  'iteratorVar',
                )}`,
                { path, component },
              )
            }
          } else {
          }
        } else {
          log.red(
            'Attempted to evaluate a path "function" from an if object but ' +
              'a component is required to query for a dataObject. The "src" ' +
              'value will default to its raw path',
            { component, path },
          )
        }
        return resolvePath(path)
      }
    }

    return ''
  }
}

export default NOODL
