import _ from 'lodash'
import { isDraft, original } from 'immer'
import Logger from 'logsnap'
import {
  evalIf,
  findParent,
  isBoolean as isNOODLBoolean,
  isBooleanTrue,
  isEmitObj,
  isListConsumer,
  findDataObject,
  findListDataObject,
  createEmitDataKey,
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
  isPromise,
} from './utils/common'
import { isActionChainEmitTrigger, resolveAssetUrl } from './utils/noodl'
import createComponent from './utils/createComponent'
import Action from './Action'
import ActionChain from './ActionChain'
import EmitAction from './Action/EmitAction'
import { event } from './constants'
import * as T from './types'

const log = Logger.create('noodl-ui')

function _createState(state?: Partial<T.INOODLUiState>): T.INOODLUiState {
  return {
    // nodes: new Map(), // Unused atm
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
  #getRoot: () => { [key: string]: any } = () => ({})
  #parser: T.RootsParser
  #resolvers: Resolver[] = []
  #root: { [key: string]: any } = {}
  #state: T.INOODLUiState
  #viewport: T.IViewport
  actionsContext: { emitCall?: any; noodlui: NOODL } = { noodlui: this }
  initialized: boolean = false

  constructor({
    showDataKey,
    viewport,
  }: {
    showDataKey?: boolean
    viewport?: T.IViewport
  } = {}) {
    this.#parser = makeRootsParser({ root: {} })
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

    _.forEach(this.#resolvers, (r: T.IResolver) =>
      r.resolve(component, consumerOptions),
    )

    // this.emit('afterResolve', component, consumerOptions)

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

  #getCbPath = (key: T.EventId | 'action' | 'chaining' | 'all') => {
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
      const path = this.#getCbPath(key as any)
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
    actions: T.ActionObject[],
    options: {
      component: T.IComponentTypeInstance
      trigger: T.IActionChainEmitTrigger
    },
  ) {
    const actionChain = new ActionChain(
      _.isArray(actions) ? actions : [actions],
      {
        actionsContext: this.getActionsContext(),
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
    useActionObjects.forEach((f) => {
      actionChain.useAction(f)
    })
    actionChain.useBuiltIn(
      _.map(_.entries(this.#cb.builtIn), ([funcName, fn]) => ({
        funcName,
        fn,
      })),
    )
    // @ts-expect-error
    if (!window.ac) window['ac'] = {}
    // @ts-expect-error
    window.ac[options.component?.id || ''] = actionChain
    return actionChain.build()
  }

  init({
    _log = true,
    actionsContext,
    viewport,
  }: { _log?: boolean; actionsContext?: NOODL['actionsContext'] } & Partial<
    Parameters<T.INOODLUi['init']>[0]
  > = {}) {
    if (!_log) Logger.disable()
    if (viewport) this.setViewport(viewport)
    this.initialized = true
    if (actionsContext) _.assign(this.actionsContext, actionsContext)
    return this
  }

  getBaseStyles(styles?: T.Style) {
    return {
      ...this.#getRoot()?.Style,
      position: 'absolute',
      outline: 'none',
      ...styles,
    }
  }

  getActionsContext() {
    return Object.assign({}, this.actionsContext)
  }

  getContext() {
    return {
      assetsUrl: this.assetsUrl,
      page: this.page,
      root: this.#getRoot(),
      viewport: this.#viewport,
    } as T.ResolverContext
  }

  getEmitHandlers(
    trigger: T.IActionChainEmitTrigger | T.ResolveEmitTrigger,
  ): T.IActionChainUseObjectBase<any>[]
  getEmitHandlers(
    trigger: (handlers: T.IActionChainUseObjectBase<any>) => boolean,
  ): T.IActionChainUseObjectBase<any>[]
  getEmitHandlers(
    trigger?:
      | (T.IActionChainEmitTrigger | T.ResolveEmitTrigger)
      | ((handlers: T.IActionChainUseObjectBase<any>) => boolean),
  ) {
    const handlers = this.#cb.action.emit || []
    if (!arguments.length) {
      return handlers
    }
    if (trigger) {
      if (typeof trigger === 'string') {
        return handlers.filter((o) => o.trigger === trigger)
      } else if (typeof trigger === 'function') {
        return handlers.filter((o) => trigger(o))
      }
    }
    return handlers
  }

  getPageObject(page: string) {
    return this.#getRoot()[page]
  }

  getStateHelpers() {
    return {
      ...this.getStateGetters(),
      ...this.getStateSetters(),
    }
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
      getBaseStyles: this.getBaseStyles.bind(this),
      getRoot: this.#getRoot,
      page: this.page,
      resolveComponent: this.#resolve.bind(this),
      resolveComponentDeep: this.resolveComponents.bind(this),
      parser: this.parser,
      showDataKey: this.#state.showDataKey,
      ...this.getStateGetters(),
      ...this.getStateSetters(),
      ...rest,
    } as T.ConsumerOptions
  }

  getResolvers() {
    return this.#resolvers.map((resolver) => resolver.resolve)
  }

  getState() {
    return this.#state
  }

  getStateGetters() {
    return {
      getPageObject: this.getPageObject.bind(this),
      getState: this.getState.bind(this),
    }
  }

  getStateSetters() {
    return {}
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

  use(resolver: T.IResolver | T.IResolver[]): this
  use(action: T.IActionChainUseObject | T.IActionChainUseObject[]): this
  use(viewport: T.IViewport): this
  use(opts: { getRoot: T.ConsumerOptions['getRoot'] }): this
  use(
    mod:
      | T.IResolver
      | T.IActionChainUseObject
      | T.IViewport
      | { getRoot: T.ConsumerOptions['getRoot'] }
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
        } else if ('getRoot' in m) {
          this.#getRoot = m.getRoot
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

  reset(opts?: { keepCallbacks?: boolean } = {}) {
    this.#root = {}
    this.#parser = makeRootsParser({ root: this.#root })
    this.#state = _createState()
    if (!opts.keepCallbacks) {
      this.#cb = { action: [], builtIn: [], chaining: [] }
    }
    return this
  }

  createSrc(
    path: T.EmitActionObject,
    component?: T.IComponentTypeInstance,
  ): string | Promise<string>
  createSrc(
    path: T.IfObject,
    component?: T.IComponentTypeInstance,
  ): string | Promise<string>
  createSrc(
    path: string,
    component?: T.IComponentTypeInstance,
  ): string | Promise<string>
  createSrc(
    path: string | T.EmitActionObject | T.IfObject,
    component?: T.IComponentTypeInstance,
  ) {
    log.func('createSrc')
    if (isDraft(path)) path = original(path)

    if (path) {
      // Plain strings
      if (_.isString(path)) {
        return resolveAssetUrl(path, this.assetsUrl)
      }
      // "If" object evaluation
      else if (path.if) {
        path = evalIf((val: any) => {
          if (isNOODLBoolean(val)) return isBooleanTrue(val)
          if (typeof val === 'function') {
            if (component) {
              return val(
                findDataObject({
                  component,
                  dataKey: component.get('dataKey'),
                  pageObject: this.getPageObject(this.page),
                }),
              )
            } else {
              return val()
            }
          }
          return !!val
        }, path as T.IfObject)
        return resolveAssetUrl(path as string, this.assetsUrl)
      }
      // Emit object evaluation
      else if (isEmitObj(path)) {
        // TODO - narrow this query to avoid only using the first encountered obj
        const obj = this.#cb.action.emit?.find?.((o) => o?.trigger === 'path')

        if (typeof obj?.fn === 'function') {
          const emitObj = { ...path, actionType: 'emit' } as T.EmitActionObject
          const emitAction = new EmitAction(emitObj, { trigger: 'path' })

          let dataObject: any

          if (emitObj.emit?.dataKey) {
            if (_.isPlainObject(emitObj.emit.dataKey)) {
              let prevKey: string
              Object.entries(emitObj.emit.dataKey).forEach(([key, value]) => {
                if (typeof value === 'string') {
                  // If the current key was used in the previous loop, use that result
                  if (prevKey === key && !_.isNil(dataObject)) {
                    return emitAction.setDataKey(key, dataObject)
                  }

                  dataObject = findDataObject({
                    component,
                    dataKey: value,
                    pageObject: this.getPageObject(this.page),
                    root: this.#getRoot(),
                  })
                }
                if (dataObject) emitAction.setDataKey(key, dataObject)
                prevKey = key
              })
            } else if (typeof emitObj.emit.dataKey === 'string') {
              emitAction.setDataKey(
                emitObj.emit.dataKey,
                findDataObject({
                  component,
                  dataKey: emitObj.emit.dataKey,
                  pageObject: this.getPageObject[this.page],
                  root: this.#getRoot(),
                }),
              )
            }
          }

          if (component?.get('iteratorVar')) {
            emitAction.set('iteratorVar', component.get('iteratorVar'))
          }

          emitAction['callback'] = async (snapshot) => {
            const callbacks = _.reduce(
              this.#cb.action.emit || [],
              (acc, obj) => (obj?.trigger === 'path' ? acc.concat(obj) : acc),
              [],
            )

            if (!callbacks.length) return ''

            const result = await Promise.race(
              callbacks.map((obj) =>
                obj?.fn?.(
                  emitAction,
                  this.getConsumerOptions({
                    assetsUrl: this.assetsUrl,
                    component: component as T.IComponentTypeInstance,
                    path,
                    snapshot,
                  }),
                  this.actionsContext,
                ),
              ),
            )

            // TODO - implement other scenarios
            if (Array.isArray(result)) {
              if (result.length) {
                //
              }
              return result[0]
            }
            return result || ''
          }

          // Result returned should be a string type
          let result = emitAction.execute(path)

          if (isPromise(result)) {
            // Turn this into an EmitAction
            // const emitAction = new EmitAction(path, { trigger: 'path' })
            // emitAction.callback = (...args) => Promise.resolve(...args)
            return result
              .then((res) =>
                typeof res === 'string' && res.startsWith('http')
                  ? res
                  : resolveAssetUrl(res, this.assetsUrl),
              )
              .catch((err) => Promise.reject(err))
          } else if (result) {
            if (
              typeof result === 'string' &&
              (result as string).startsWith('http')
            ) {
              return result
            }
            return resolveAssetUrl(result, this.assetsUrl)
          }
        }
      }
      // Assuming we are passing in a dataObject
      else if (typeof path === 'function') {
        if (component) {
          const dataObject: any = findDataObject({
            component,
            dataKey: component.get('dataKey'),
            pageObject: this.getPageObject(this.page),
            root: this.#getRoot(),
          })
          // Assuming it is a component retrieving its value from a dataObject
          if (component.get?.('iteratorVar')) {
            path = evalIf((fn, val1, val2) => {
              const result = fn?.(dataObject)
              if (result) {
                log.grey(
                  `Result of path "if" func is truthy. Returning: ${val1}`,
                  {
                    component,
                    dataObject,
                    if: path?.if,
                    valOnTrue: val1,
                    valOnFalse: val2,
                  },
                )
              } else {
                log.grey(
                  `Result of path "if" func is falsey. Returning: ${val2}`,
                  {
                    component,
                    dataObject,
                    if: path?.if,
                    valOnTrue: val1,
                    valOnFalse: val2,
                  },
                )
              }
              return result
            }, path)
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
        return resolveAssetUrl(path, this.assetsUrl)
      }
    }

    return ''
  }
}

export default NOODL
