import Logger from 'logsnap'
import pick from 'lodash/pick'
import {
  ComponentCreationType,
  ComponentInstance,
  NOODLComponent,
  Page as NOODLUiPage,
} from 'noodl-ui'
import { openOutboundURL } from './utils/common'
import { pageEvent, pageStatus } from './constants'
import { createEmptyObjectWithKeys } from './utils/common'
import noodlui from './app/noodl-ui'
import noodluidom from './app/noodl-ui-dom'
import Modal from './components/NOODLModal'
import { AnyFn } from './app/types'
import * as T from './app/types/pageTypes'

const log = Logger.create('Page.ts')

export type IPage = Page

class Page {
  #state = {
    current: '',
    previous: '',
    requesting: '',
    modifiers: {} as {
      [pageName: string]: { force?: boolean; reload?: boolean } & {
        [key: string]: any
      }
    },
    status: pageStatus.IDLE as T.PageStatus,
    rootNode: false,
  }
  #cbs = {
    ...createEmptyObjectWithKeys(
      Object.values(pageEvent),
      [] as T.PageCallbackObjectConfig[],
    ),
    ...createEmptyObjectWithKeys(
      Object.values(pageStatus),
      [] as T.PageCallbackObjectConfig[],
    ),
  }
  pageUrl: string = 'index.html?'
  rootNode: HTMLElement | null = null
  modal: Modal

  constructor() {
    this.modal = new Modal()
    this.#createRootNode()
  }

  #createRootNode = () => {
    if (this.rootNode === null) this.rootNode = document.createElement('div')
    this.rootNode.id = 'root'
    this.rootNode.style.position = 'absolute'
    this.rootNode.style.width = '100%'
    this.rootNode.style.height = '100%'
    if (!document.body.contains(this.rootNode))
      document.body.appendChild(this.rootNode)
  }

  getCbs() {
    return this.#cbs
  }

  clearCbs() {
    for (let obj of Object.values(this.#cbs)) {
      Array.isArray(obj) && (obj.length = 0)
    }
    return this
  }

  getState() {
    return this.#state
  }

  /**
   * Requests to change the page to another page
   * TODO - Merge this into page.navigate
   * @param { string } newPage - Page name to request
   * @param { boolean | undefined } options.goBack
   */
  async requestPageChange(
    newPage: string = '',
    {
      force,
      goBack = false,
      reload,
    }: { force?: boolean; goBack?: boolean; reload?: boolean } = {},
  ) {
    if (
      newPage !== this.getState().current ||
      newPage.startsWith('http') ||
      !!force
    ) {
      this.setRequestingPage(newPage)
      if (goBack) {
        this.setModifier(newPage, { reload: reload === false ? false : true })
      }
      if (process.env.NODE_ENV !== 'test') {
        history.pushState({}, '', this.pageUrl)
      }
      await this.navigate(newPage)
      this.setPreviousPage(this.getState().current).setCurrentPage(newPage)
    } else {
      log.func('requestPageChange')
      log.orange(
        'Skipped the request to change page because we are already on the page',
        { ...pick(this.getState(), ['previous', 'current']), newPage },
      )
      await this.emit(pageEvent.ON_NAVIGATE_ABORT, {
        pageName: newPage,
        from: 'requestPageChange',
      })
    }
  }

  /**
   * Navigates to the next page using pageName. It first prepares the rootNode
   * and begins parsing the NOODL components before rendering them to the rootNode.
   * Returns a snapshot of the page name, object, and its parsed/rendered components
   * @param { string } pageName
   */
  async navigate(pageName: string): Promise<{ snapshot: any } | void> {
    // TODO: onTimedOut
    try {
      this.setStatus(pageStatus.NAVIGATING)
      // Outside link
      if (typeof pageName === 'string' && pageName.startsWith('http')) {
        await this.emit(pageEvent.ON_OUTBOUND_REDIRECT, pageName)
        openOutboundURL(pageName)
        return this.setStatus(pageStatus.IDLE)
      }
      this.setRequestingPage(pageName)
      await this.emit(pageEvent.ON_NAVIGATE_START, pageName)

      // The caller is expected to provide their own page object
      const pageSnapshot = (await this.emit(
        pageEvent.ON_BEFORE_RENDER_COMPONENTS,
        { pageName, rootNode: this.rootNode },
      )) as NOODLUiPage

      const requestingPage = this.getState().requesting

      this.setStatus(pageStatus.SNAPSHOT_RECEIVED)
      // Sometimes a navigate request coming from another location like a
      // "goto" action can invoke a request in the middle of this operation.
      // Give the latest call the priority
      if (requestingPage && requestingPage !== pageName) {
        log.grey(
          `Aborting this navigate request for ${pageName} because a more ` +
            `recent request to "${requestingPage}" was called`,
          { pageAborting: pageName, pageRequesting: requestingPage },
        )
        this.setStatus(pageStatus.IDLE)
        await this.emit(pageEvent.ON_NAVIGATE_ABORT, {
          pageName,
          from: 'navigate',
        })
        return
      }

      const components = this.render(
        pageSnapshot?.object?.components as NOODLComponent[],
      ) as ComponentInstance[]

      // Remove the page modifiers so they don't propagate to subsequent navigates
      delete this.#state.modifiers[pageName]

      this.setStatus(pageStatus.COMPONENTS_RENDERED)
      await this.emit(pageEvent.ON_COMPONENTS_RENDERED, {
        pageName,
        components,
      })

      this.setRequestingPage('').setCurrentPage(pageName)
      this.setStatus(pageStatus.IDLE)

      return {
        snapshot: Object.assign({ components }, pageSnapshot),
      }
    } catch (error) {
      await this.emit(pageEvent.ON_NAVIGATE_ERROR, { error, pageName })
      this.setStatus(pageStatus.NAVIGATE_ERROR)
      throw new Error(error)
    }
  }

  /**
   * Takes a list of raw NOODL components and converts them into DOM nodes and appends
   * them to the DOM
   * @param { NOODLUIPage } page - Page in the shape of { name: string; object: null | PageObject }
   */
  render(rawComponents: ComponentCreationType | ComponentCreationType[]) {
    // Create the root node where we will be placing DOM nodes inside.
    // The root node is a direct child of document.body
    if (!this.rootNode) {
      this.setStatus(pageStatus.CREATING_ROOT_NODE)
      this.#createRootNode()
      this.setStatus(pageStatus.ROOT_NODE_CREATED)
      this.emitSync(pageEvent.ON_CREATE_ROOT_NODE, this.rootNode)
    }
    this.setStatus(pageStatus.RESOLVING_COMPONENTS)
    let resolved = noodlui.resolveComponents(rawComponents)
    this.setStatus(pageStatus.COMPONENTS_RESOLVED)
    const components = Array.isArray(resolved) ? resolved : [resolved]
    this.rootNode && (this.rootNode.innerHTML = '')
    this.setStatus(pageStatus.RENDERING_COMPONENTS)
    components.forEach((component) => {
      noodluidom.parse(component, this.rootNode)
    })
    this.setStatus(pageStatus.COMPONENTS_RENDERED)
    this.emitSync(pageEvent.ON_COMPONENTS_RENDERED)
    return components
  }

  /**
   * Returns a JS representation of the current state of this page instance
   */
  snapshot() {
    return {
      ...pick(this.getState(), ['status', 'previous', 'current', 'requesting']),
      rootNode: this.rootNode,
    }
  }

  createCbConfig(
    config: Partial<T.PageCallbackObjectConfig>,
  ): T.PageCallbackObjectConfig
  createCbConfig(fn: AnyFn): T.PageCallbackObjectConfig
  createCbConfig(fn: any) {
    const config = {} as T.PageCallbackObjectConfig
    if (typeof fn === 'function') {
      config.fn = fn
    } else if (fn && typeof fn === 'object') {
      Object.assign(config, fn)
    }
    return config
  }

  on(
    event: T.PageEvent | T.PageStatus,
    fn: AnyFn | T.PageCallbackObjectConfig,
  ) {
    if (!Array.isArray(this.#cbs[event])) this.#cbs[event] = []
    this.#cbs[event].push(
      this.createCbConfig(typeof fn === 'function' ? { fn } : fn),
    )
    return this
  }

  once(
    event: T.PageEvent | T.PageStatus,
    config: Partial<T.PageCallbackObjectConfig>,
  ): this
  once(event: T.PageEvent | T.PageStatus, fn: AnyFn): this
  once(event: T.PageEvent | T.PageStatus, fn: any) {
    if (!Array.isArray(this.#cbs[event])) this.#cbs[event] = []
    this.#cbs[event].push(
      this.createCbConfig(typeof fn === 'function' ? { fn, once: true } : fn),
    )
    return this
  }

  async emit(event: T.PageEvent | T.PageStatus, ...args: any[]) {
    let result
    let fnObjs = this.#cbs[event]
    if (fnObjs?.length) {
      const numObjs = fnObjs.length
      for (let index = 0; index < numObjs; index++) {
        const obj = fnObjs[index]
        // For now we will just use the first return value received
        // as the value to the caller that called emit if they are
        // expecting some value
        if (obj.once) fnObjs.splice(fnObjs.indexOf(obj), 1)
        if (!result) result = await obj.fn(...args)
        else await obj.fn(...args)
      }
    }
    return result
  }

  emitSync(event: T.PageEvent | T.PageStatus, ...args: any[]) {
    let result
    let fnObjs = this.#cbs[event]
    if (fnObjs?.length) {
      const numObjs = fnObjs.length
      for (let index = 0; index < numObjs; index++) {
        const obj = fnObjs[index]
        // For now we will just use the first return value received
        // as the value to the caller that called emit if they are
        // expecting some value
        if (obj.once) fnObjs.splice(fnObjs.indexOf(obj), 1)
        if (!result) result = obj.fn(...args)
        else obj.fn(...args)
      }
    }
    return result
  }

  setStatus(status: T.PageStatus) {
    this.#state.status = status
    this.emitSync(status, status)
    return this
  }

  setPreviousPage(name: string) {
    this.#state.previous = name
    return this
  }

  setCurrentPage(name: string) {
    this.#state.current = name
    return this
  }

  setModifier(page: string, obj: { [key: string]: any }) {
    if (!this.#state.modifiers[page]) this.#state.modifiers[page] = {}
    Object.assign(this.#state.modifiers[page], obj)
    return this
  }

  setRequestingPage(name: string) {
    this.#state.requesting = name
    return this
  }
}

export default Page
