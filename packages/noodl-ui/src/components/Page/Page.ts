import {
  ActionChainContext,
  ComponentConstructor,
  ComponentInstance,
  ComponentType,
  IComponent,
  INOODLUI,
  NOODLComponent,
  PageComponentEventId,
} from '../../types'
import Component from '../Base'
import Viewport from '../../Viewport'
import { event } from '../../constants'
import { PageComponentObject } from 'noodl-types'

const e = event.component.page

class Page
  extends Component
  implements IComponent<PageComponentObject, 'page'>, INOODLUI {
  #actionsContext: ActionChainContext
  #cbs = {
    [e.SET_REF]: [] as any[],
    [e.COMPONENTS_RECEIVED]: [] as any[],
    [e.RESOLVED_COMPONENTS]: [] as any[],
    [e.MISSING_COMPONENTS]: [] as any[],
  }
  #componentCache: INOODLUI['componentCache']
  #createActionChainHandler: INOODLUI['createActionChainHandler']
  #createSrc: INOODLUI['createSrc']
  #createPluginObject: INOODLUI['createPluginObject']
  #getAssetsUrl: () => string = () => ''
  #getBaseStyles: INOODLUI['getBaseStyles']
  #getBaseUrl: () => string = () => ''
  #getContext: INOODLUI['getContext']
  #getPageObject: INOODLUI['getPageObject']
  #getStateHelpers: INOODLUI['getStateHelpers']
  #getConsumerOptions: INOODLUI['getConsumerOptions']
  #getResolvers: INOODLUI['getResolvers']
  #getState: INOODLUI['getState']
  #getStateGetters: INOODLUI['getStateGetters']
  #getStateSetters: INOODLUI['getStateSetters']
  #noodlType: string = ''
  #page = ''
  #plugins: INOODLUI['plugins']
  #reset: INOODLUI['reset']
  #resolveComponents: INOODLUI['resolveComponents']
  #use: INOODLUI['use']
  #unuse: INOODLUI['unuse']
  #viewport: Viewport
  assetsUrl = ''

  constructor(...args: any | ConstructorParameters<ComponentConstructor>) {
    super(
      ...((args.length
        ? args
        : [{ type: 'page' }]) as ConstructorParameters<ComponentConstructor>),
    )
    this.#page = this.get('path') as string
  }

  get page() {
    return this.#page
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
    noodlComponents: NOODLComponent[],
  ): this
  emit(
    event: typeof e.RESOLVED_COMPONENTS,
    components: ComponentInstance[],
  ): this
  emit(
    event: typeof e.MISSING_COMPONENTS,
    opts: { component: ComponentInstance; path: string },
  ): this
  emit(event: PageComponentEventId, ...args: any[]) {
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
    fn: (noodlComponents: NOODLComponent[]) => any,
  ): this
  on(
    event: typeof e.RESOLVED_COMPONENTS,
    fn: (components: ComponentInstance[]) => void,
  ): this
  on(
    event: typeof e.MISSING_COMPONENTS,
    fn: (opts: { component: ComponentInstance; path: string }) => void,
  ): this
  on(event: PageComponentEventId, fn: any) {
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

  getActionsContext() {
    return this.#actionsContext
  }

  reset() {
    return this
  }

  setPage(page: string) {
    this.#page = page
    return this
  }

  get actionsContext() {
    return this.#actionsContext
  }

  set actionsContext(actionsContext: ActionChainContext) {
    this.#actionsContext = actionsContext
  }

  get componentCache() {
    return this.#componentCache
  }

  set componentCache(componentCache) {
    this.#componentCache = componentCache
  }

  get createActionChainHandler() {
    return this.#createActionChainHandler
  }

  set createActionChainHandler(createActionChainHandler) {
    this.#createActionChainHandler = createActionChainHandler
  }

  get createSrc() {
    return this.#createSrc
  }

  set createSrc(createSrc) {
    this.#createSrc = createSrc
  }

  get createPluginObject() {
    return this.#createPluginObject
  }

  set createPluginObject(createPluginObject) {
    this.#createPluginObject = createPluginObject
  }

  get getBaseStyles() {
    return this.#getBaseStyles
  }

  set getBaseStyles(getBaseStyles) {
    this.#getBaseStyles = getBaseStyles
  }

  get getAssetsUrl() {
    return this.#getAssetsUrl
  }

  set getAssetsUrl(getAssetsUrl) {
    this.#getAssetsUrl = getAssetsUrl
  }

  get getBaseUrl() {
    return this.#getBaseUrl
  }

  set getBaseUrl(getBaseUrl) {
    this.#getBaseUrl = getBaseUrl
  }

  get getContext() {
    return this.#getContext
  }

  set getContext(getContext) {
    this.#getContext = getContext
  }

  get getPageObject() {
    return this.#getPageObject
  }

  set getPageObject(getPageObject) {
    this.#getPageObject = getPageObject
  }

  get getStateHelpers() {
    return this.#getStateHelpers
  }

  set getStateHelpers(getStateHelpers) {
    this.#getStateHelpers = getStateHelpers
  }

  get getConsumerOptions() {
    return ((args: any) => {
      this.#getConsumerOptions({ ...args, component: this })
    }) as INOODLUI['getConsumerOptions']
  }

  set getConsumerOptions(getConsumerOptions) {
    this.#getConsumerOptions = getConsumerOptions
  }

  get getResolvers() {
    return this.#getResolvers
  }

  set getResolvers(getResolvers) {
    this.#getResolvers = getResolvers
  }

  get getState() {
    return this.#getState
  }

  set getState(getState) {
    this.#getState = getState
  }

  get getStateGetters() {
    return this.#getStateGetters
  }

  set getStateGetters(getStateGetters) {
    this.#getStateGetters = getStateGetters
  }

  get getStateSetters() {
    return this.#getStateSetters
  }

  set getStateSetters(getStateSetters) {
    this.#getStateSetters = getStateSetters
  }

  get plugins() {
    return this.#plugins
  }

  set plugins(plugins) {
    this.#plugins = plugins
  }

  get resolveComponents() {
    return this.#resolveComponents
  }

  set resolveComponents(resolveComponents) {
    this.#resolveComponents = resolveComponents
  }

  get use() {
    return this.#use
  }

  set use(use) {
    this.#use = use
  }

  get unuse() {
    return this.#unuse
  }

  set unuse(unuse) {
    this.#unuse = unuse
  }
}

export default Page
