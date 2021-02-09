import get from 'lodash/get'
import set from 'lodash/set'
import noop from 'lodash/noop'
import { isDraft, original } from 'immer'
import Logger from 'logsnap'
import {
  ActionType,
  ComponentObject,
  EmitObject,
  Identify,
  RegisterComponentObject,
} from 'noodl-types'
import {
  createEmitDataKey,
  evalIf,
  isBoolean as isNOODLBoolean,
  isBooleanTrue,
  isEmitObj,
  isIfObj,
} from 'noodl-utils'
import Resolver from './Resolver'
import Viewport from './Viewport'
import _internalResolver from './resolvers/_internal'
import {
  forEachDeepEntries,
  formatColor,
  getRandomKey,
  hasLetter,
  isPromise,
  toNumber,
} from './utils/common'
import {
  findListDataObject,
  getPluginTypeLocation,
  isActionChainEmitTrigger,
  resolveAssetUrl,
} from './utils/noodl'
import Page from './components/Page'
import createComponent from './utils/createComponent'
import createComponentCache from './utils/componentCache'
import getActionConsumerOptions from './utils/getActionConsumerOptions'
import isComponent from './utils/isComponent'
import ActionChain from './ActionChain'
import EmitAction from './Action/EmitAction'
import getStore from './store'
import { event } from './constants'
import * as T from './types'
import { isPlainObject } from 'lodash'

const log = Logger.create('noodl-ui')
let id = 0

function _createState(initialState?: Partial<T.State>) {
  return {
    page: '',
    plugins: { head: [], body: { top: [], bottom: [] } },
    registry: {},
    ...initialState,
  } as T.State
}

class NOODL {
  #id: number
  #cache = createComponentCache()
  #cb: {
    action: Partial<
      Record<T.ActionType | 'emit' | 'goto' | 'toast', T.StoreActionObject[]>
    >
    builtIn: { [funcName: string]: T.StoreBuiltInObject[] }
    chaining: Partial<Record<T.ActionChainEventId, Function[]>>
    on: {
      [event.SET_PAGE]: ((pageName: string) => void)[]
      [event.NEW_PAGE]: ((page: string) => Promise<NOODL> | undefined)[]
      [event.NEW_PAGE_REF]: ((ref: Page) => Promise<void> | undefined)[]
    }
    registered: {
      [key: string]: {
        onEvent?: {
          [eventName: string]: {
            component: T.ComponentInstance
            key: string
            id: string
            prop: 'onEvent'
            fn: (emittedArgs: {
              key: string
              id: string
              prop: 'onEvent'
              data: any
            }) => Promise<any>
          }
        }
      }
    }
  } = {
    action: {},
    builtIn: {},
    chaining: Object.values(event.actionChain).reduce(
      (acc, key) => Object.assign(acc, { [key]: [] }),
      {},
    ),
    on: {
      [event.SET_PAGE]: [],
      [event.NEW_PAGE]: [],
      [event.NEW_PAGE_REF]: [],
    },
    registered: {},
  }
  #fetch = ((typeof window !== 'undefined' && window.fetch) || noop) as T.Fetch
  #getAssetsUrl: () => string = () => ''
  #getBaseUrl: () => string = () => ''
  #getPreloadPages: () => string[] = () => []
  #getPages: () => string[] = () => []
  #resolvers: Resolver[] = []
  #getRoot: () => T.Root = () => ({})
  #state: T.State
  #viewport: Viewport
  actionsContext: T.ActionChainContext = { noodlui: this }
  refs: { main: NOODL } & { [page: string]: NOODL } = {} as { main: NOODL } & {
    [page: string]: NOODL
  }
  initialized: boolean = false

  constructor({
    showDataKey,
    viewport,
  }: {
    showDataKey?: boolean
    viewport?: Viewport
  } = {}) {
    id++
    this.#id = id
    log.func('Constructor')
    log.grey(`Instance id ${id} created`, this)
    this.#state = _createState({ showDataKey })
    this.#viewport = viewport || new Viewport()
  }

  get id() {
    return this.#id
  }

  get assetsUrl() {
    return this.#getAssetsUrl()
  }

  get page() {
    return this.#state.page
  }

  get root() {
    return this.#getRoot()
  }

  get viewport() {
    return this.#viewport
  }

  resolveComponents(component: T.ComponentCreationType): T.ComponentInstance
  resolveComponents(
    components: T.ComponentCreationType[],
  ): T.ComponentInstance[]
  resolveComponents(
    componentsParams:
      | T.ComponentCreationType
      | T.ComponentCreationType[]
      | T.PageObjectContainer['object'],
  ) {
    let components: any[] = []
    let resolvedComponents: T.ComponentInstance[] = []

    if (componentsParams) {
      if (isComponent(componentsParams)) {
        components = [componentsParams]
      } else if (
        !Array.isArray(componentsParams) &&
        typeof componentsParams === 'object'
      ) {
        if ('components' in componentsParams) {
          components = componentsParams.components
        } else {
          components = [componentsParams]
        }
      } else if (Array.isArray(componentsParams)) {
        components = componentsParams
      } else if (typeof componentsParams === 'string') {
        components = [componentsParams]
      }
    }

    // Page components are currently not using plugins
    if (this?.plugins) {
      // Add plugin components first
      ;[
        ...this.plugins('head').map((plugin: T.PluginObject) => plugin.ref),
        ...this.plugins('body-top').map((plugin: T.PluginObject) => plugin.ref),
        ...this.plugins('body-bottom').map(
          (plugin: T.PluginObject) => plugin.ref,
        ),
      ].forEach((c) => this.#resolve(c))
    }

    // ;[...this.registry(this.page)]

    // Finish off with the internal resolvers to handle the children
    components.forEach((c) => {
      const component = this.#resolve(c)
      _internalResolver.resolve(
        component,
        this.getConsumerOptions({ component }),
        this,
      )
      resolvedComponents.push(component)
    })

    return Array.isArray(componentsParams)
      ? resolvedComponents
      : resolvedComponents[0]
  }

  #resolve = (c: T.ComponentType | T.ComponentInstance | ComponentObject) => {
    const component = createComponent(c as any)
    const consumerOptions = this.getConsumerOptions({ component })
    const baseStyles = this.getBaseStyles(component)

    component.id = component.id || getRandomKey()
    component.assignStyles(baseStyles)

    // Finalizing
    if (component.style && typeof component.style === 'object') {
      forEachDeepEntries(component.style, (key, value) => {
        if (typeof value === 'string') {
          if (value.startsWith('0x')) {
            component.set('style', key, formatColor(value))
          } else if (/(fontsize|borderwidth|borderradius)/i.test(key)) {
            if (!hasLetter(value)) component.set('style', key, `${value}px`)
          }
        }
      })
    }

    getStore().resolvers.forEach((obj) => {
      obj.resolver.resolve(component, consumerOptions)
    })

    return component
  }

  createActionChainHandler(
    actions: T.ActionObject[],
    options: T.ActionConsumerCallbackOptions & {
      trigger?: T.ActionChainEmitTrigger
    },
  ) {
    const actionChain = new ActionChain(
      Array.isArray(actions) ? actions : [actions],
      options as T.ActionConsumerCallbackOptions & {
        trigger: T.ActionChainEmitTrigger
      },
      this.actionsContext,
    )
    Object.values(getStore().actions).forEach((objs) => {
      objs.forEach((obj) => {
        if (isEmitObj(obj)) {
          // Only accept the emit action handlers where their
          // actions only exist in action chains
          if (!isActionChainEmitTrigger(obj.trigger)) return
          obj.actionType = 'emit'
        }
        actionChain.useAction(obj)
      })
    })
    Object.values(getStore().builtIns).forEach((obj) => {
      actionChain.useBuiltIn(obj)
    })
    // @ts-expect-error
    if (!window.ac) window['ac'] = {}
    // @ts-expect-error
    window.ac[options.component?.id || ''] = actionChain
    return actionChain.build.call(actionChain).bind(actionChain)
  }

  createSrc<O extends T.EmitObject>(
    path: O,
    component?: T.ComponentInstance,
  ): string | Promise<string>
  createSrc<O extends T.IfObject>(
    path: O,
    component?: T.ComponentInstance,
  ): string | Promise<string>
  createSrc<S extends string>(
    path: S,
    component?: T.ComponentInstance,
  ): string | Promise<string>
  createSrc(
    path: string | T.EmitObject | T.IfObject,
    component?: T.ComponentInstance,
  ) {
    log.func('createSrc')
    // TODO - fix this in the component constructor so we can remove this
    if (isDraft(path)) path = original(path) as typeof path

    if (path) {
      if (typeof path === 'string') {
        // Components of type "noodl" can have a path that points directly to a page
        // ex: "path: LeftPage"
        if (
          this.#getPages()
            .concat(this.#getPreloadPages())
            .includes(path)
        ) {
          const pageLink = this.#getBaseUrl() + path + '_en.yml'
          setTimeout(() => component?.emit('path', pageLink))
          return pageLink
        } else {
          return resolveAssetUrl(path, this.assetsUrl)
        }
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
        const obj = getStore().actions.emit?.find?.((o) => o.trigger === 'path')

        if (typeof obj?.fn === 'function') {
          const emitObj = { ...path, actionType: 'emit' } as T.EmitActionObject
          const emitAction = new EmitAction(emitObj, {
            iteratorVar: component?.get('iteratorVar'),
            trigger: 'path',
          })
          if ('dataKey' in (emitAction.original.emit || {})) {
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
          }

          emitAction['callback'] = async (snapshot) => {
            log.grey(`Executing emit action callback`, snapshot)
            const callbacks = (getStore().actions.emit || []).reduce(
              (acc, obj) => (obj?.trigger === 'path' ? acc.concat(obj) : acc),
              [],
            )

            if (!callbacks.length) return ''

            const result = await Promise.race(
              callbacks.map((obj: T.StoreActionObject) =>
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
            path = evalIf((fn, val1, val2) => fn?.(dataObject), path)
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
      : (noop as Window['fetch'])) as T.Fetch
  }

  createPluginObject(component: T.ComponentInstance): T.PluginObject
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
    } else if (isComponent(plugin)) {
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

  on(e: typeof event.SET_PAGE, fn: (page: string) => void): this
  on(
    e: typeof event.NEW_PAGE,
    fn: (page: string) => Promise<T.NOODLComponent[] | undefined>,
  ): this
  on(
    e: typeof event.NEW_PAGE_REF,
    fn: (ref: NOODL) => Promise<void> | undefined,
  ): this
  on(e: any, fn: any) {
    if ([event.SET_PAGE, event.NEW_PAGE, event.NEW_PAGE_REF].includes(e)) {
      if (!this.#cb.on[e]) this.#cb.on[e] = []
      if (!this.#cb.on[e].includes(fn)) {
        this.#cb.on[e].push(fn)
      }
    }
    return this
  }

  // TODO - Support other types of register args
  register({
    component,
    key,
  }: {
    component: T.ComponentInstance | RegisterComponentObject
    key: string
  }) {
    let id: string = ''
    let inst: T.ComponentInstance
    let prop: string = 'onEvent' // Hard code to onEvent for now
    let cbs = this.getCbs('register')

    if (isComponent(component)) {
      id = component.original?.onEvent || ''
      inst = component
    } else {
      id = component.onEvent || ''
      inst = this.resolveComponents(component)
    }

    if (!cbs[key]) cbs[key] = {}
    if (!cbs[key][prop]) cbs[key][prop] = {}

    cbs[key][prop][id] = {
      component: inst,
      prop,
      id,
      key,
      fn: async (data: any) => {
        log.func('onNOODLUIEmit')

        const registerInfo = { component, prop, id, key, data }

        log.grey('', registerInfo)

        if (inst.original?.emit) {
          // Limiting the consumer objs to 1 for now
          const obj = getStore().actions.emit?.find?.(
            (o) => o.trigger === 'register',
          )

          if (typeof obj?.fn === 'function') {
            const emitObj = { emit: inst.original.emit } as EmitObject
            const dataKey = inst.original.emit?.dataKey
            const emitAction = new EmitAction(emitObj as T.EmitActionObject, {
              trigger: 'register',
            })

            if (typeof dataKey === 'string') {
              if (dataKey === prop) emitAction.setDataKey(registerInfo.data)
              else emitAction.setDataKey(prop)
            } else if (isPlainObject(dataKey)) {
              emitAction.setDataKey(
                Object.entries(dataKey).reduce((acc, [key, value]) => {
                  if (value === prop) acc[key] = registerInfo.data
                  else acc[key] = value
                  return acc
                }, {}),
              )
            }

            emitAction.callback = async (snapshot) => {
              log.grey(`Executing register emit action callback`, snapshot)
              const result = await obj?.fn?.(
                emitAction,
                this.getConsumerOptions({ component: inst }),
                this.actionsContext,
              )
              return (Array.isArray(result) ? result[0] : result) || ''
            }

            let result = await emitAction.execute(emitObj)
            inst.emit(prop, { ...registerInfo, result })

            log.gold(`REGISTER EMIT PROCESS FINISHED`, {
              dataKey,
              emitAction,
              emitObj,
              registerInfo,
              result,
            })
          }
        }
      },
    }

    return cbs[key][prop][id]
  }

  // emit(eventName: T.NOODLComponentEventId, cb: T.ComponentEventCallback): void
  emit(
    eventName: 'register',
    args: { key: string; id?: string; prop: 'onEvent'; data?: string },
  ): this
  emit(
    eventName: T.EventId,
    ...args: Parameters<T.ComponentEventCallback>
  ): this
  emit(eventName: string, ...args: any[]) {
    if (typeof eventName === 'string') {
      if (eventName === 'register') {
        // type ex: "onEvent"
        const { prop = '', key = '', id = '', data } = args[0] || {}
        if (prop === 'onEvent') {
          const cbs = this.getCbs('register')
          const fn = cbs[key]?.[prop]?.[id]?.fn
          if (typeof fn === 'function') {
            const result = fn(data)
            if (isPromise(result)) {
              result
                .then((res) =>
                  log.grey(`Emit result for register event: `, res),
                )
                .catch((err) => {
                  throw new Error(err)
                })
            } else {
              log.grey(`Emit result for register event: `, result)
            }
          } else {
            log.func('emit')
            log.red(
              'Could not locate a "register" component to send this message to',
              args[0],
            )
          }
        }
      } else {
        const path = this.#getCbPath(eventName)
        if (path) {
          let cbs = get(this.#cb, path) as Function[]
          if (!Array.isArray(cbs)) cbs = cbs ? [cbs] : []
          cbs.forEach((cb) => cb(...args))
        }
      }
    }
    return this
  }

  off(eventName: T.EventId, cb: T.ComponentEventCallback) {
    if (typeof eventName === 'string') {
      const path = this.#getCbPath(eventName)
      if (path) {
        const cbs = get(this.#cb, path)
        if (Array.isArray(cbs)) {
          if (cbs.includes(cb)) {
            set(
              this.#cb,
              path,
              cbs.filter((fn) => fn !== cb),
            )
          }
        }
      }
    }
    return this
  }

  #getCbPath = (key: T.EventId | 'action' | 'chaining' | 'all') => {
    let path = ''
    const store = getStore()
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
    } else if (
      [event.SET_PAGE, event.NEW_PAGE, event.NEW_PAGE_REF].includes(key as any)
    ) {
      path = `on.${key}`
    }
    return path
  }

  getCbs(
    key: 'actions',
  ): Partial<
    Record<ActionType | 'emit' | 'goto' | 'toast', T.StoreActionObject[]>
  >
  getCbs(
    key: 'builtIns',
  ): Partial<
    Record<ActionType | 'emit' | 'goto' | 'toast', T.StoreBuiltInObject[]>
  >
  getCbs(
    key?:
      | 'actions'
      | 'builtIns'
      | 'chaining'
      | 'register'
      | typeof event.SET_PAGE
      | typeof event.NEW_PAGE
      | typeof event.NEW_PAGE_REF,
  ) {
    switch (key) {
      case 'actions':
      case 'builtIns':
      case 'chaining':
        return getStore()[key] as any
      case 'register':
        return this.#cb.registered
      case event.SET_PAGE:
      case event.NEW_PAGE:
      case event.NEW_PAGE_REF:
        return this.#cb.on[key]
    }
    return this.#cb
  }

  removeCbs(actionType: string, funcName?: string) {
    if (getStore().actions[actionType])
      getStore().actions[actionType].length = 0
    if (actionType === 'builtIn' && funcName) {
      if (getStore().builtIns[funcName])
        getStore().builtIns[funcName].length = 0
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
    if (actionsContext) Object.assign(this.actionsContext, actionsContext)
    if (getAssetsUrl) this.#getAssetsUrl = getAssetsUrl
    if (getRoot) this.#getRoot = getRoot
    if (viewport) this.setViewport(viewport)
    this.initialized = true
    return this
  }

  getBaseStyles(component?: T.ComponentInstance) {
    let styles = (component?.original?.style as T.Style) || undefined
    // if (styles?.top === 'auto') styles.top = '0'
    if (isPlainObject(styles)) {
      if (!('top' in styles)) styles.top = '0'

      if (isComponent(component)) {
        const parent = component.parent() as T.ComponentInstance
        let top

        if (parent) {
          let parentTop = parent?.style?.top
          let parentHeight = parent?.style?.height

          // if (parentTop === 'auto') parentTop = '0'
          if (parentTop !== undefined) top = toNumber(parentTop)
          if (parentHeight !== undefined) top = top + toNumber(parentHeight)

          if (typeof top === 'number') {
            top = (this.viewport.height as number) - top
            component.setStyle('top', top + 'px')
            if (!('height' in (component.style || {}))) {
              // component.setStyle('height', 'auto')
            }
          }

          if (parent.style?.axis === 'vertical') {
            styles.position = 'relative'
            styles.height = 'auto'
          }

          log.gold('Component is missing "top"', {
            original: component.original,
            component,
            parent: component.parent(),
            parentTop,
            parentHeight,
            computedTopForThisComponent: top,
            viewport: {
              width: this.viewport.width,
              height: this.viewport.height,
            },
          })
        } else {
        }

        if (!('height' in component.style)) {
          component.style.height = 'auto'
        }
      } else if (isPlainObject(component)) {
        //
      }
    }

    return {
      ...this.#getRoot().Style,
      position: 'absolute',
      outline: 'none',
      ...styles,
    }
  }

  getActionsContext() {
    return this.actionsContext
  }

  getContext() {
    return {
      actionsContext: this.actionsContext,
      assetsUrl: this.assetsUrl,
      page: this.page,
    } as T.ResolverContext
  }

  getPageObject(page: string) {
    return this.#getRoot()[page]
  }

  getBaseUrl() {
    return this.#getBaseUrl?.()
  }

  getConsumerOptions({
    component,
    ...rest
  }: {
    component: T.ComponentInstance
    [key: string]: any
  }) {
    return {
      component,
      componentCache: this.componentCache.bind(this),
      context: this.getContext(),
      createActionChainHandler: (action, options) =>
        this.createActionChainHandler(action, {
          ...getActionConsumerOptions(this),
          ...options,
          component: component as T.ComponentInstance,
        }),
      createSrc: ((path: string) => this.createSrc(path, component)).bind(this),
      fetch: this.#fetch.bind(this),
      getAssetsUrl: this.#getAssetsUrl.bind(this),
      getBaseUrl: this.#getBaseUrl.bind(this),
      getBaseStyles: this.getBaseStyles.bind(this),
      getCbs: this.getCbs.bind(this),
      getPreloadPages: this.#getPreloadPages.bind(this),
      getPages: this.#getPages.bind(this),
      getPageObject: this.getPageObject.bind(this),
      getResolvers: (() => this.#resolvers).bind(this),
      getRoot: this.#getRoot.bind(this),
      getState: this.getState.bind(this),
      plugins: this.plugins.bind(this),
      page: this.page,
      resolveComponent: this.#resolve.bind(this),
      resolveComponentDeep: this.resolveComponents.bind(this),
      showDataKey: this.#state.showDataKey,
      viewport: this.#viewport,
      setPlugin: this.setPlugin.bind(this),
      ...rest,
    } as T.ConsumerOptions
  }

  getResolvers() {
    return this.#resolvers.map((resolver) => resolver.resolve)
  }

  getState() {
    return this.#state
  }

  setPage(pageName: string) {
    this.#state['page'] = pageName
    this.#cb.on[event.SET_PAGE]?.forEach((cb) => cb?.(pageName))
    this.componentCache().clear()
    return this
  }

  setViewport(viewport: Viewport) {
    this.#viewport = viewport // main
    return this
  }

  plugins(location: 'head'): T.PluginObject[]
  plugins(location: 'body-top'): T.PluginObject[]
  plugins(location: 'body-bottom'): T.PluginObject[]
  plugins(location?: T.PluginLocation) {
    switch (location) {
      case 'head':
        return this.getState()?.plugins?.head
      case 'body-top':
        return this.getState()?.plugins?.body.top
      case 'body-bottom':
        return this.getState()?.plugins?.body.bottom
      default:
        return this.getState()?.plugins
    }
  }

  getRef(key: string) {
    return this.refs[key]
  }

  setRef(key: string, ref: NOODL) {
    this.refs[key] = ref
  }

  setPlugin(value: T.PluginCreationType) {
    if (!value) return
    const plugin: T.PluginObject = this.createPluginObject(value)
    if (plugin.location === 'head') {
      this.#state?.plugins?.head.push(plugin)
    } else if (plugin.location === 'body-top') {
      this.#state?.plugins?.body.top.push(plugin)
    } else if (plugin.location === 'body-bottom') {
      this.#state?.plugins?.body.bottom.push(plugin)
    }
    return plugin
  }

  registry<K extends string = any>(pageName: string): T.State['registry'][K]
  registry(pageName?: string): T.State['registry']
  registry(pageName?: string) {
    if (typeof pageName === 'string' && pageName in this.getState().registry) {
      return this.getState().registry[pageName]
    }
    return this.getState().registry
  }

  /**
   * Spawns a new noodl-ui instance and stores the reference in memory
   * This is used to create a "sandboxed" noodl-ui engine to render isolated
   * components (useful for iframes). This by default is used internally by
   * components of type: page
   * @param { string } page - Page name
   * @param { ...object } constructorArgs - Arguments to the constructor
   */
  spawn(page: string, ...constructorArgs: ConstructorParameters<typeof NOODL>) {
    this.refs[page] = new NOODL(...constructorArgs)
    this.refs[page].init({ actionsContext: this.actionsContext })
    this.refs[page].setPage(page)
    // this.refs[page].viewport.width = this.viewport.width
    // this.refs[page].viewport.height = this.viewport.height
    this.refs[page].use({
      fetch: this.#fetch.bind(this),
      getAssetsUrl: (() => this.assetsUrl).bind(this),
      getBaseUrl: this.#getBaseUrl.bind(this),
      getPreloadPages: this.#getPreloadPages.bind(this),
      getPages: this.#getPages.bind(this),
      getRoot: this.#getRoot.bind(this),
      plugins: this.plugins.bind(this),
    })
    this.refs[page].setRef('parent', this)
    return this.refs[page]
  }

  use(resolver: Resolver | Resolver[]): this
  use(action: T.ActionChainUseObject | T.ActionChainUseObject[]): this
  use(viewport: Viewport): this
  use(o: {
    actionsContext?: Partial<NOODL['actionsContext']>
    fetch?: T.Fetch
    getAssetsUrl?(): string
    getBaseUrl?(): string
    getPreloadPages?(): string[]
    getPages?(): string[]
    getRoot?(): T.Root
    plugins?: T.PluginCreationType[]
  }): this
  use(
    mod:
      | Resolver
      | T.ActionChainUseObject
      | Viewport
      | {
          actionsContext?: Partial<NOODL['actionsContext']>
          getAssetsUrl?(): string
          getBaseUrl?(): string
          getPreloadPages?(): string[]
          getPages?(): string[]
          getRoot?(): T.Root
          plugins?: T.PluginCreationType[]
        }
      | (
          | Resolver
          | T.ActionChainUseObject
          | {
              actionsContext?: Partial<NOODL['actionsContext']>
              getAssetsUrl?(): string
              getBaseUrl?(): string
              getPreloadPages?(): string[]
              getPages?(): string[]
              getRoot?(): T.Root
              plugins?: T.PluginCreationType[]
            }
        )[],
    ...rest: any[]
  ) {
    const mods = ((Array.isArray(mod) ? mod : [mod]) as any[]).concat(rest)
    const handleMod = (m: typeof mods[number]) => {
      if (m) {
        if ('actionType' in m || 'funcName' in m || 'resolver' in m) {
          getStore().use(m)
        } else if (m instanceof Viewport) {
          this.setViewport(m)
        } else if (m instanceof Resolver) {
          this.#resolvers.push(m)
        } else if (
          'actionsContext' in m ||
          'fetch' in m ||
          'getAssetsUrl' in m ||
          'getBaseUrl' in m ||
          'getPreloadPages' in m ||
          'getPages' in m ||
          'getRoot' in m ||
          'plugins' in m
        ) {
          // prettier-ignore
          if ('actionsContext' in m) Object.assign(this.actionsContext, m.actionsContext)
          if ('getAssetsUrl' in m) this.#getAssetsUrl = m.getAssetsUrl
          if ('getBaseUrl' in m) this.#getBaseUrl = m.getBaseUrl
          if ('getPreloadPages' in m) this.#getPreloadPages = m.getPreloadPages
          if ('getPages' in m) this.#getPages = m.getPages
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

    mods.forEach((m) => {
      if (Array.isArray(m)) [...m, ...rest].forEach((_m) => handleMod(_m))
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
        this.#resolvers = this.#resolvers.filter((r) => r !== mod)
      }
    }
    return this
  }

  componentCache() {
    return this.#cache
  }

  reset(
    opts: {
      keepCallbacks?: boolean
      keepPlugins?: boolean
      keepRegistry?: boolean
      keepActions?: boolean
      keepBuiltIns?: boolean
    } = {},
  ) {
    const newState = {} as Partial<T.State>
    if (opts.keepPlugins) newState.plugins = this.#state.plugins
    if (opts.keepRegistry) newState.registry = this.#state.registry
    this.#state = _createState(newState)
    if (!opts.keepCallbacks) {
      this.#cb = {
        action: [],
        builtIn: [],
        chaining: [],
        on: { page: [] },
      } as any
    }
    if (!opts.keepActions) getStore().clearActions()
    if (!opts.keepBuiltIns) getStore().clearBuiltIns()
    return this
  }
}

export default NOODL
