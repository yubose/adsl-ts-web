import Logger from 'logsnap'
import {
  ComponentObject,
  ComponentType,
  PageComponentObject,
} from 'noodl-types'
import {
  createEmitDataKey,
  evalIf,
  isBoolean as isNOODLBoolean,
  isBooleanTrue,
  isComponent,
  isEmitObj,
  isIfObj,
} from 'noodl-utils'
import { current, isDraft, original } from 'immer'
import { event } from '../constants'
import {
  findListDataObject,
  isActionChainEmitTrigger,
  publish,
  resolveAssetUrl,
} from '../utils/noodl'
import ActionChain from '../ActionChain'
import Component from './Base'
import getStore from '../store'
import Viewport from '../Viewport'
import * as u from '../utils/internal'
import {
  forEachDeepEntries,
  formatColor,
  getRandomKey,
  hasLetter,
  isPromise,
} from '../utils/common'
import getActionConsumerOptions from '../utils/getActionConsumerOptions'
import * as T from '../types'
import EmitAction from '../Action/EmitAction'
import componentCache from '../utils/componentCache'
import { ActionObject } from '../types'

const log = Logger.create('Page (component)')

const e = event.component.page

function _createState(initialState?: Partial<T.State>) {
  return {
    page: '',
    plugins: { head: [], body: { top: [], bottom: [] } },
    registry: {},
    ...initialState,
  } as T.State
}

class Page
  extends Component
  implements T.IComponent<PageComponentObject, 'page'> {
  #actionsContext: T.ActionChainContext = {} as T.ActionChainContext
  #cbs = {
    [e.SET_REF]: [] as any[],
    [e.COMPONENTS_RECEIVED]: [] as any[],
    [e.RESOLVED_COMPONENTS]: [] as any[],
    [e.MISSING_COMPONENTS]: [] as any[],
  }
  #getAssetsUrl: () => string = () => ''
  #getBaseUrl: () => string = () => ''
  #getPages: () => string[] = () => []
  #getPreloadPages: () => string[] = () => []
  #getRoot: () => T.Root
  #page = ''
  #state: T.State
  #viewport: Viewport
  _internalResolver: any = {}
  assetsUrl = ''
  componentCache = componentCache
  createComponent: (...args: any[]) => any = (f) => f
  showDataKey = true

  constructor(...args: any | ConstructorParameters<T.ComponentConstructor>) {
    super(
      ...((args.length
        ? args
        : [{ type: 'page' }]) as ConstructorParameters<T.ComponentConstructor>),
    )
    this.setPage(this.get('path') as string)
    this.#state = _createState()
  }

  get page() {
    return this.#page
  }

  get pages() {
    return this.#getPages()
  }

  get preloadPages() {
    return this.#getPreloadPages()
  }

  get viewport() {
    return this.#viewport
  }

  set viewport(viewport: Viewport) {
    this.#viewport = viewport
  }

  emit(event: typeof e.SET_REF, ref: any): this
  emit(
    event: typeof e.COMPONENTS_RECEIVED,
    noodlComponents: T.NOODLComponent[],
  ): this
  emit(
    event: typeof e.RESOLVED_COMPONENTS,
    components: T.ComponentInstance[],
  ): this
  emit(
    event: typeof e.MISSING_COMPONENTS,
    opts: { component: T.ComponentInstance; path: string },
  ): this
  emit(event: T.PageComponentEventId, ...args: any[]) {
    const emitCbs = (arr: any[]) => arr.forEach((f) => f(...args))
    if (event === e.SET_REF) {
      emitCbs(this.#cbs[e.SET_REF])
    } else if (event === e.COMPONENTS_RECEIVED) {
      emitCbs(this.#cbs[e.COMPONENTS_RECEIVED])
    } else if (event === e.RESOLVED_COMPONENTS) {
      emitCbs(this.#cbs[e.RESOLVED_COMPONENTS])
    } else if (event === e.MISSING_COMPONENTS) {
      emitCbs(this.#cbs[e.MISSING_COMPONENTS])
    }
    return this
  }

  on(event: typeof e.SET_REF, fn: (ref: any) => any): this
  on(
    event: typeof e.COMPONENTS_RECEIVED,
    fn: (noodlComponents: T.NOODLComponent[]) => any,
  ): this
  on(
    event: typeof e.RESOLVED_COMPONENTS,
    fn: (components: T.ComponentInstance[]) => void,
  ): this
  on(
    event: typeof e.MISSING_COMPONENTS,
    fn: (opts: { component: T.ComponentInstance; path: string }) => void,
  ): this
  on(event: T.PageComponentEventId, fn: any) {
    if (event === e.SET_REF) {
      this.#cbs[e.SET_REF].push(fn)
    } else if (event === e.COMPONENTS_RECEIVED) {
      this.#cbs[e.COMPONENTS_RECEIVED].push(fn)
    } else if (event === e.RESOLVED_COMPONENTS) {
      this.#cbs[e.RESOLVED_COMPONENTS].push(fn)
    } else if (event === e.MISSING_COMPONENTS) {
      this.#cbs[e.MISSING_COMPONENTS].push(fn)
    }
    return this
  }

  reset() {
    return this
  }

  setPage(page: string) {
    this.#page = page
    publish(this, (child) => {
      log.func('[setPage][publish]')
      const cache = this.componentCache()
      if (cache.has(child)) {
        log.grey(`Clearing ${child.id} from componentCache`)
        this.componentCache().remove(child)
      }
    })
    return this
  }

  get actionsContext() {
    return this.#actionsContext
  }

  set actionsContext(actionsContext: T.ActionChainContext) {
    this.#actionsContext = actionsContext
  }

  createActionChainHandler(
    actions: T.ActionObject[],
    options: T.ActionConsumerCallbackOptions & {
      trigger: T.ActionChainEmitTrigger
    },
  ) {
    const actionChain = new ActionChain(
      u.isArr(actions) ? actions : [actions],
      options,
      this.actionsContext,
    )
    Object.entries(getStore().actions).forEach(([actionType, objs]) => {
      objs.forEach((obj) => {
        // Only accept the emit action handlers where their
        // actions only exist in action chains
        actionChain.useAction({
          ...obj,
          actionType: isActionChainEmitTrigger(obj.trigger)
            ? 'emit'
            : actionType,
        })
      })
    })
    Object.values(getStore().builtIns).forEach((objs) => {
      objs.forEach((obj) => actionChain.useBuiltIn(obj))
    })
    // @ts-expect-error
    if (!window.ac) window['ac'] = {}
    // @ts-expect-error
    window.ac[options.component?.id || ''] = actionChain
    return actionChain.build().bind(actionChain)
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
        if (this.getPages().concat(this.getPreloadPages()).includes(path)) {
          const pageLink = this.getBaseUrl() + path + '_en.yml'
          setTimeout(() => component?.emit('path', pageLink))
          return pageLink
        } else {
          return resolveAssetUrl(path, this.getAssetsUrl())
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
          this.getAssetsUrl(),
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
          if ('dataKey' in emitAction.original.emit || {}) {
            emitAction.setDataKey(
              createEmitDataKey(
                emitObj.emit.dataKey,
                [
                  findListDataObject(component as T.ComponentInstance),
                  () => this.getPageObject(this.page),
                  () => this.getRoot(),
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
              callbacks.map((obj: T.ActionChainUseObjectBase) =>
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
                  finalizedRes = resolveAssetUrl(
                    String(res),
                    this.getAssetsUrl(),
                  )
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
            finalizedRes = resolveAssetUrl(result, this.getAssetsUrl())
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
        return resolveAssetUrl(path, this.getAssetsUrl())
      }
    }

    return ''
  }

  getBaseStyles(styles?: T.Style) {
    return {
      ...this.getRoot().Style,
      position: 'absolute',
      outline: 'none',
      ...styles,
    }
  }

  getContext() {
    return {
      actionsContext: this.actionsContext,
      assetsUrl: this.getAssetsUrl(),
      page: this.page,
    } as T.ResolverContext
  }

  getAssetsUrl() {
    return this.#getAssetsUrl()
  }

  getBaseUrl() {
    return this.#getBaseUrl()
  }

  getPageObject(page: string) {
    return this.getRoot()[page]
  }

  getPages() {
    return this.#getPages()
  }

  getPreloadPages() {
    return this.#getPreloadPages()
  }

  getRoot() {
    return this.#getRoot() || {}
  }

  getResolvers() {
    return getStore().resolvers
  }

  getState() {
    return this.#state
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
      createActionChainHandler: ((
        actions: ActionObject[],
        options: { trigger: T.ActionChainEmitTrigger },
      ) => {
        return this.createActionChainHandler(actions, {
          ...getActionConsumerOptions(this),
          ...options,
          component,
        })
      }).bind(this),
      createSrc: ((path: string) => this.createSrc(path, component)).bind(this),
      getAssetsUrl: this.getAssetsUrl.bind(this),
      getBaseUrl: this.getBaseUrl.bind(this),
      getBaseStyles: this.getBaseStyles.bind(this),
      getCbs: this.getCbs.bind(this),
      getPreloadPages: this.getPreloadPages.bind(this),
      getPages: this.getPages.bind(this),
      getPageObject: this.getPageObject.bind(this),
      getResolvers: this.getResolvers.bind(this),
      getRoot: this.getRoot.bind(this),
      getState: this.getState.bind(this),
      page: this.page,
      resolveComponent: this.#resolve.bind(this),
      resolveComponentDeep: this.resolveComponents.bind(this),
      showDataKey: this.showDataKey,
      viewport: this.viewport,
      ...rest,
    }
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

    // Add plugin components first
    // ;[
    //   ...this.plugins('head').map((plugin: T.PluginObject) => plugin.ref),
    //   ...this.plugins('body-top').map((plugin: T.PluginObject) => plugin.ref),
    //   ...this.plugins('body-bottom').map(
    //     (plugin: T.PluginObject) => plugin.ref,
    //   ),
    // ].forEach((c) => this.#resolve(c))
    // ;[...this.registry(this.page)]

    // Finish off with the internal resolvers to handle the children
    components.forEach((c) => {
      const component = this.#resolve(c)
      this._internalResolver.resolve(
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

  #resolve = (c: ComponentType | T.ComponentInstance | ComponentObject) => {
    const component = this.createComponent(c as any)
    const consumerOptions = this.getConsumerOptions({ component })
    const baseStyles = this.getBaseStyles(component.original?.style)
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

    getStore().resolvers.forEach((obj) =>
      obj.resolver.resolve(component, consumerOptions as T.ConsumerOptions),
    )

    return component
  }

  toJS() {
    return {
      ...super.toJS(),
      id: this.id,
      children: this.children.map((child) => child?.toJS?.()),
      assetsUrl: this.getAssetsUrl(),
      baseUrl: this.getBaseUrl(),
      currentPage: this.page,
      pages: this.getPages(),
      preloadPages: this.getPreloadPages(),
      root: this.getRoot(),
    }
  }

  plugins() {
    return []
  }

  use<A extends T.ActionObject>(obj: T.StoreActionObject<A>): this
  use<B extends T.BuiltInObject>(obj: T.StoreBuiltInObject<B>): this
  use<V extends Viewport>(viewport: V): this
  use(options: {
    actionsContext?: Partial<T.ActionChainContext>
    getAssetsUrl?(): string
    getBaseUrl?(): string
    getPreloadPages?(): string[]
    getPages?(): string[]
    getRoot?(): T.Root
    [key: string]: any
  }): this
  use(
    v:
      | T.StoreActionObject<any>
      | T.StoreBuiltInObject<any>
      | Viewport
      | {
          actionsContext?: Partial<T.ActionChainContext>
          getAssetsUrl?(): string
          getBaseUrl?(): string
          getPreloadPages?(): string[]
          getPages?(): string[]
          getRoot?(): T.Root
          [key: string]: any
        },
  ) {
    if (v) {
      if ('actionType' in v || 'funcName' in v || 'resolver' in v) {
        getStore().use(v as any)
      } else if (v instanceof Viewport) {
        this.viewport = v
      } else {
        // prettier-ignore
        if ('actionsContext' in v) u.assign(this.actionsContext, v.actionsContext)
        if ('getAssetsUrl' in v)
          this.#getAssetsUrl = v.getAssetsUrl as Page['getAssetsUrl']
        if ('getBaseUrl' in v)
          this.#getBaseUrl = v.getBaseUrl as Page['getBaseUrl']
        if ('getPreloadPages' in v)
          this.#getPreloadPages = v.getPreloadPages as Page['getPreloadPages']
        if ('getPages' in v) this.#getPages = v.getPages as Page['getPages']
        if ('getRoot' in v) this.#getRoot = v.getRoot as Page['getRoot']
      }
    }
    return this
  }
}

export default Page
