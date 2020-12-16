import _ from 'lodash'
import { isDraft, original } from 'immer'
import Logger from 'logsnap'
import {
  createEmitDataKey,
  evalIf,
  findListDataObject,
  isBoolean as isNOODLBoolean,
  isBooleanTrue,
  isEmitObj,
  isIfObj,
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
import {
  getPluginTypeLocation,
  isActionChainEmitTrigger,
  resolveAssetUrl,
} from './utils/noodl'
import createComponent from './utils/createComponent'
import createComponentCache from './utils/componentCache'
import getActionConsumerOptions from './utils/getActionConsumerOptions'
import Action from './Action'
import ActionChain from './ActionChain'
import EmitAction from './Action/EmitAction'
import { event } from './constants'
import * as T from './types'

const log = Logger.create('noodl-ui')

function _createState(state?: Partial<T.State>) {
  return {
    page: '',
    plugins: { head: [], body: { top: [], bottom: [] } },
    ...state,
  } as T.State
}

class NOODL {
  #cache = createComponentCache()
  #cb: {
    action: Partial<
      Record<T.ActionType, T.ActionChainUseObjectBase<any, any>[]>
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
  #fetch = ((typeof window !== 'undefined' && window.fetch) ||
    _.noop) as T.Fetch
  #getAssetsUrl: () => string = () => ''
  #parser: T.RootsParser
  #resolvers: Resolver[] = []
  #getRoot: () => T.Root = () => ({})
  #state: T.State
  #viewport: Viewport
  actionsContext: T.ActionChainContext = { noodlui: this }
  initialized: boolean = false

  constructor({
    showDataKey,
    viewport,
  }: {
    showDataKey?: boolean
    viewport?: Viewport
  } = {}) {
    this.#parser = makeRootsParser({ root: {} })
    this.#state = _createState({ showDataKey })
    this.#viewport = viewport || new Viewport()
  }

  get assetsUrl() {
    return this.#getAssetsUrl()
  }

  get page() {
    return this.#state.page
  }

  get parser() {
    return this.#parser
  }

  get root() {
    return this.#getRoot()
  }

  get viewport() {
    return this.#viewport
  }

  resolveComponents(component: T.ComponentCreationType): Component
  resolveComponents(components: T.ComponentCreationType[]): Component[]
  resolveComponents(
    componentsParams:
      | T.ComponentCreationType
      | T.ComponentCreationType[]
      | T.Page['object'],
  ) {
    let components: any[] = []
    let resolvedComponents: Component[] = []

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

    // Add plugin components first
    _.forEach(
      [
        ..._.map(this.plugins('head'), (plugin: T.PluginObject) => plugin.ref),
        ..._.map(
          this.plugins('body-top'),
          (plugin: T.PluginObject) => plugin.ref,
        ),
        ..._.map(
          this.plugins('body-bottom'),
          (plugin: T.PluginObject) => plugin.ref,
        ),
      ],
      (c) => this.#resolve(c),
    )

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

  #resolve = (c: T.ComponentType | Component | T.ComponentObject) => {
    const component = createComponent(c)
    const consumerOptions = this.getConsumerOptions({ component })
    const baseStyles = this.getBaseStyles(component.original.style)

    if (!component?.id) component.id = getRandomKey()

    component.assignStyles(baseStyles)

    // TODO - deprecate this
    if (this.parser.getLocalKey() !== this.page) {
      this.parser.setLocalKey(this.page)
    }

    // Finalizing
    if (component.style && typeof component.style === 'object') {
      forEachDeepEntries(component.style, (key, value) => {
        if (_.isString(value)) {
          if (value.startsWith('0x')) {
            component.set('style', key, formatColor(value))
          } else if (/(fontsize|borderwidth|borderradius)/i.test(key)) {
            if (!hasLetter(value)) component.set('style', key, `${value}px`)
          }
        }
      })
    }

    _.forEach(this.#resolvers, (r: Resolver) =>
      r.resolve(component, consumerOptions),
    )

    return component
  }

  createActionChainHandler(
    actions: T.ActionObject[],
    options: T.ActionConsumerCallbackOptions & {
      trigger?: T.ActionChainEmitTrigger
    },
  ) {
    const actionChain = new ActionChain(
      _.isArray(actions) ? actions : [actions],
      options as T.ActionConsumerCallbackOptions & {
        trigger: T.ActionChainEmitTrigger
      },
      this.actionsContext,
    )
    const useActionObjects = _.reduce(
      _.entries(this.#cb.action),
      (arr, [actionType, actionObjs]) =>
        arr.concat(
          _.reduce(
            actionObjs || [],
            (
              acc,
              actionObj: Omit<
                T.ActionChainUseObjectBase<any, any>,
                'actionType'
              >,
            ) => {
              if (
                isEmitObj(actionObj) &&
                isActionChainEmitTrigger(actionObj.trigger)
              ) {
                // Only accept the emit action handlers where their
                // actions only exist in action chains
                return acc.concat({ ...actionObj, actionType: 'emit' })
              }
              return acc.concat({ actionType, ...actionObj } as any)
            },
            [] as T.ActionChainUseObjectBase<any, any>[],
          ),
        ),
      [] as any[],
    )
    useActionObjects.forEach((f) => actionChain.useAction(f))
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

  createSrc<O extends T.EmitObject>(
    path: O,
    component?: Component,
  ): string | Promise<string>
  createSrc<O extends T.IfObject>(
    path: O,
    component?: Component,
  ): string | Promise<string>
  createSrc<S extends string>(
    path: S,
    component?: Component,
  ): string | Promise<string>
  createSrc(path: string | T.EmitObject | T.IfObject, component?: Component) {
    log.func('createSrc')
    // TODO - fix this in the component constructor so we can remove this
    if (isDraft(path)) path = original(path) as typeof path

    if (path) {
      // Plain strings
      if (_.isString(path)) {
        return resolveAssetUrl(path, this.assetsUrl)
      }
      // "If" object evaluation
      else if (isIfObj(path)) {
        return resolveAssetUrl(
          evalIf((val: any) => {
            if (isNOODLBoolean(val)) return isBooleanTrue(val)
            if (typeof val === 'function') {
              if (component) return val(findListDataObject(component))
              return val()
            }
            return !!val
          }, path as T.IfObject),
          this.assetsUrl,
        )
      }
      // Emit object evaluation
      else if (isEmitObj(path)) {
        // TODO - narrow this query to avoid only using the first encountered obj
        const obj = this.#cb.action.emit?.find?.((o) => o?.trigger === 'path')

        if (typeof obj?.fn === 'function') {
          const emitObj = { ...path, actionType: 'emit' } as T.EmitActionObject
          const emitAction = new EmitAction(emitObj, {
            iteratorVar: component?.get('iteratorVar'),
            trigger: 'path',
          })
          if ('dataKey' in emitAction.original.emit || {}) {
            emitAction.setDataKey(
              createEmitDataKey(
                emitObj.emit.dataKey,
                [
                  findListDataObject(component),
                  () => this.getPageObject(this.page),
                  () => this.#getRoot(),
                ],
                { iteratorVar: emitAction.iteratorVar },
              ),
            )
            log.grey(
              `Data key finalized for path emit`,
              emitAction.getSnapshot(),
            )
          }

          emitAction['callback'] = async (snapshot) => {
            log.grey(`Executing emit action callback`, snapshot)
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
                  this.getConsumerOptions({ component, path }),
                  // Action context
                  this.actionsContext,
                ),
              ),
            )

            return (Array.isArray(result) ? result[0] : result) || ''
          }

          // Result returned should be a string type
          let result = emitAction.execute(path) as string | Promise<string>
          let finalizedRes = ''

          log.grey(`Result received from emit action`, {
            action: emitAction,
            result,
          })

          if (isPromise(result)) {
            return result
              .then((res) => {
                if (typeof res === 'string' && res.startsWith('http')) {
                  finalizedRes = res
                } else {
                  finalizedRes = resolveAssetUrl(String(res), this.assetsUrl)
                }
                log.grey(`Resolved promise with: `, finalizedRes)
                component?.emit('path', finalizedRes)
                return finalizedRes
              })
              .catch((err) => Promise.reject(err))
          } else if (result) {
            if (typeof result === 'string' && result.startsWith('http')) {
              finalizedRes = result
              component?.emit('path', finalizedRes)
              return result
            }
            finalizedRes = resolveAssetUrl(result, this.assetsUrl)
            component?.emit('path', finalizedRes)
          }
        }
      }
      // Assuming we are passing in a dataObject
      else if (typeof path === 'function') {
        if (component) {
          const dataObject: any = findListDataObject(component)
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
        return resolveAssetUrl(path, this.#getAssetsUrl())
      }
    }

    return ''
  }

  #createFetch = (fetchFn: T.Fetch | undefined): T.Fetch => {
    if (fetchFn) {
      this.#fetch = fetchFn
      return this.#fetch
    }
    return (typeof window !== 'undefined'
      ? (...args) =>
          window
            .fetch?.(...(args as Parameters<Window['fetch']>))
            .then((response) => response.json())
      : (_.noop as Window['fetch'])) as T.Fetch
  }

  createPluginObject(component: Component): T.PluginObject
  createPluginObject(component: T.ComponentObject): T.PluginObject
  createPluginObject(plugin: T.PluginObject): T.PluginObject
  createPluginObject(path: string): T.PluginObject
  createPluginObject(plugin: T.PluginCreationType): T.PluginObject
  createPluginObject(plugin: T.PluginCreationType): T.PluginObject {
    if (typeof plugin === 'string') {
      plugin = {
        content: '',
        location: 'head',
        path: plugin,
        ref: createComponent({
          type: 'pluginHead',
          location: 'head',
          path: plugin,
          content: '',
        }),
      }
    } else if (plugin instanceof Component) {
      plugin = {
        content: plugin.get('content') || '',
        location: getPluginTypeLocation(plugin.noodlType) as T.PluginLocation,
        path: plugin.get('path'),
        ref: plugin,
      }
    } else if ('type' in plugin) {
      plugin = {
        content: plugin.content || '',
        location: getPluginTypeLocation(plugin.type as string) || 'head',
        path: plugin.path,
        ref: createComponent({
          content: '',
          path: '',
          ...plugin,
          location:
            getPluginTypeLocation(plugin.noodlType || plugin.type || '') ||
            'head',
        }),
      }
    } else if (
      'content' in plugin ||
      'location' in plugin ||
      'path' in plugin ||
      'ref' in plugin
    ) {
      plugin = {
        content: plugin.content || '',
        location: plugin.location || 'head',
        path: plugin.path || '',
        ref:
          plugin.ref ||
          createComponent({
            ...plugin,
            location: 'head',
            type: plugin.location === 'head' ? 'pluginHead' : 'pluginBodyTop',
          }),
      }
    } else {
      plugin = {
        content: '',
        location: 'head',
        path: '',
        ref: createComponent({
          type: 'pluginHead',
          content: '',
          location: 'head',
          path: '',
        }),
      }
    }
    plugin.ref.set('plugin', plugin)
    return plugin.ref.get('plugin')
  }

  on(
    eventName: T.EventId,
    cb: (
      noodlComponent: T.ComponentObject,
      args: {
        component: Component
        parent?: Component | null
      },
    ) => void,
  ) {
    if (_.isString(eventName)) this.#addCb(eventName, cb)
    return this
  }

  off(eventName: T.EventId, cb: T.ComponentEventCallback) {
    if (_.isString(eventName)) this.#removeCb(eventName, cb)
    return this
  }

  // emit(eventName: T.NOODLComponentEventId, cb: T.ComponentEventCallback): void
  emit(eventName: T.EventId, ...args: Parameters<T.ComponentEventCallback>) {
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

  getCbs(key?: 'action' | 'builtIn' | 'chaining') {
    if (key) return this.#cb[key]
    return this.#cb
  }

  removeCbs(actionType: string, funcName?: string) {
    if (this.#cb.action[actionType]) this.#cb.action[actionType].length = 0
    if (actionType === 'builtIn' && funcName) {
      if (this.#cb.builtIn[funcName]) this.#cb.builtIn[funcName].length = 0
    }
    return this
  }

  #addCb = (
    key: T.IAction | T.EventId,
    cb:
      | T.ActionChainActionCallback
      | string
      | { [key: string]: T.ActionChainActionCallback },
    cb2?: T.ActionChainActionCallback,
  ) => {
    if (key instanceof Action) {
      if (!_.isArray(this.#cb.action[key.actionType])) {
        this.#cb.action[key.actionType] = []
      }
      this.#cb.action[key.actionType].push(key)
    } else if (key === 'builtIn') {
      if (_.isString(cb)) {
        const funcName = cb
        const fn = cb2 as T.ActionChainActionCallback
        if (!_.isArray(this.#cb.builtIn[funcName])) {
          this.#cb.builtIn[funcName] = []
        }
        this.#cb.builtIn[funcName]?.push(fn)
      } else if (_.isPlainObject(cb)) {
        forEachEntries(
          cb as { [key: string]: T.ActionChainActionCallback },
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
        this.#cb[path].push(cb as T.ActionChainActionCallback)
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

  init({
    _log = true,
    actionsContext,
    getAssetsUrl,
    getRoot,
    viewport,
  }: { _log?: boolean; actionsContext?: NOODL['actionsContext'] } & {
    getAssetsUrl?: () => string
    getRoot?: () => T.Root
    plugins?: {
      fetcher?(...args: any[]): Promise<any>
      head: any[]
      body: {
        top: any[]
        bottom: any[]
      }
    }
    viewport?: Viewport
  } = {}) {
    if (!_log) Logger.disable()
    if (actionsContext) _.assign(this.actionsContext, actionsContext)
    if (getAssetsUrl) this.#getAssetsUrl = getAssetsUrl
    if (getRoot) this.#getRoot = getRoot
    if (viewport) this.setViewport(viewport)
    this.initialized = true
    return this
  }

  getBaseStyles(styles?: T.Style) {
    return {
      ...this.#getRoot().Style,
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
      actionsContext: this.actionsContext,
      assetsUrl: this.assetsUrl,
      page: this.page,
    } as T.ResolverContext
  }

  getEmitHandlers(
    trigger: T.ActionChainEmitTrigger | T.ResolveEmitTrigger,
  ): T.ActionChainUseObjectBase<any, any>[]
  getEmitHandlers(
    trigger: (handlers: T.ActionChainUseObjectBase<any, any>) => boolean,
  ): T.ActionChainUseObjectBase<any, any>[]
  getEmitHandlers(
    trigger?:
      | (T.ActionChainEmitTrigger | T.ResolveEmitTrigger)
      | ((handlers: T.ActionChainUseObjectBase<any, any>) => boolean),
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
    component: Component
    [key: string]: any
  }) {
    return {
      component,
      context: this.getContext(),
      createActionChainHandler: (action, options) =>
        this.createActionChainHandler.call(this, action, {
          ...getActionConsumerOptions(this),
          ...options,
          component,
        }),
      createSrc: ((path: string) => this.createSrc(path, component)).bind(this),
      fetch: this.#fetch.bind(this),
      getAssetsUrl: this.#getAssetsUrl.bind(this),
      getBaseStyles: this.getBaseStyles.bind(this),
      getCbs: this.getCbs.bind(this),
      getResolvers: (() => this.#resolvers).bind(this),
      getRoot: this.#getRoot.bind(this),
      page: this.page,
      resolveComponent: this.#resolve.bind(this),
      resolveComponentDeep: this.resolveComponents.bind(this),
      parser: this.parser,
      showDataKey: this.#state.showDataKey,
      viewport: this.viewport,
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
      componentCache: this.componentCache.bind(this),
      getPageObject: this.getPageObject.bind(this),
      getState: this.getState.bind(this),
      plugins: this.plugins.bind(this),
    }
  }

  getStateSetters() {
    return {
      setPlugin: this.setPlugin.bind(this),
    }
  }

  setPage(pageName: string) {
    this.#state['page'] = pageName
    this.componentCache().clear()
    return this
  }

  setViewport(viewport: Viewport) {
    this.#viewport = viewport
    return this
  }

  plugins(location?: T.PluginLocation) {
    switch (location) {
      case 'head':
        return this.getState().plugins.head
      case 'body-top':
        return this.getState().plugins.body.top
      case 'body-bottom':
        return this.getState().plugins.body.bottom
      default:
        return this.getState().plugins
    }
  }

  setPlugin(value: T.PluginCreationType) {
    if (!value) return
    const plugin: T.PluginObject = this.createPluginObject(value)
    if (plugin.location === 'head') {
      this.#state.plugins.head.push(plugin)
    } else if (plugin.location === 'body-top') {
      this.#state.plugins.body.top.push(plugin)
    } else if (plugin.location === 'body-bottom') {
      this.#state.plugins.body.bottom.push(plugin)
    }
    return plugin
  }

  use(resolver: Resolver | Resolver[]): this
  use(action: T.ActionChainUseObject | T.ActionChainUseObject[]): this
  use(viewport: T.IViewport): this
  use(o: {
    fetch?: T.Fetch
    getAssetsUrl?(): string
    getRoot?(): T.Root
    plugins?: T.PluginCreationType[]
  }): this
  use(
    mod:
      | Resolver
      | T.ActionChainUseObject
      | T.IViewport
      | {
          getAssetsUrl?(): string
          getRoot?(): T.Root
          plugins?: T.PluginCreationType[]
        }
      | (
          | Resolver
          | T.ActionChainUseObject
          | {
              getAssetsUrl?(): string
              getRoot?(): T.Root
              plugins?: T.PluginCreationType[]
            }
        )[],
    ...rest: any[]
  ) {
    const mods = ((_.isArray(mod) ? mod : [mod]) as any[]).concat(rest)
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
        } else if (
          'fetch' in m ||
          'getAssetsUrl' in m ||
          'getRoot' in m ||
          'plugins' in m
        ) {
          if ('getAssetsUrl' in m) this.#getAssetsUrl = m.getAssetsUrl
          if ('getRoot' in m) this.#getRoot = m.getRoot
          if ('fetch' in m) this.#fetch = this.#createFetch(m.fetch)
          if ('plugins' in m) {
            if (Array.isArray(m.plugins)) {
              m.plugins.forEach((plugin: T.PluginCreationType) => {
                this.setPlugin(plugin)
              })
            }
          }
        }
      }
    }

    _.forEach(mods, (m) => {
      if (_.isArray(m)) _.forEach([...m, ...rest], (_m) => handleMod(_m))
      else handleMod(m)
    })

    return this
  }

  unuse(mod: Resolver) {
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

  componentCache() {
    return this.#cache
  }

  reset(opts: { keepCallbacks?: boolean; keepPlugins?: boolean } = {}) {
    this.#parser = makeRootsParser({ root: this.#getRoot() })
    this.#state = _createState()
    if (!opts.keepCallbacks) {
      this.#cb = { action: [], builtIn: [], chaining: [] } as any
    }
    return this
  }
}

export default NOODL
