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
  rootNode: HTMLDivElement
  modal: Modal

  constructor() {
    this.modal = new Modal()
    this.rootNode = document.createElement('div')
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
    Object.values(this.#cbs).forEach((arr) => {
      while (arr.length) {
        arr.pop()
      }
    })
    return this
  }

  getState() {
    return this.#state
  }

  /**
   * Requests to change the page to another page
   * TODO - Merge this into page.navigate
   * !NOTE - Page modifiers (ex: "reload") is expected to be set before this call via page.setModifier
   * @param { string } newPage - Page name to request
   * @param { boolean | undefined } options.force - Force the navigate to happen
   */
  async requestPageChange(
    newPage: string = '',
    { force }: { force?: boolean } = {},
  ) {
    const { current } = this.getState()
    if (newPage !== current || newPage.startsWith('http') || !!force) {
      this.setRequestingPage(newPage)
      if (process.env.NODE_ENV !== 'test') {
        history.pushState({}, '', this.pageUrl)
      }
      await this.navigate(newPage)
      this.setPreviousPage(current)
      this.setCurrentPage(newPage)
    } else {
      log.func('requestPageChange')
      log.orange(
        'Skipped the request to change page because we are already on the page',
        {
          ...pick(this.getState(), ['previous', 'current']),
          requestedPage: newPage,
        },
      )
      // TODO - handle this
      await this.emit(pageEvent.ON_NAVIGATE_ABORT, {
        pageName: newPage,
        reason: 'duplicate-request',
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
        return this.#onNavigateEnd({ pageName })
      }

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
        await this.emit(pageEvent.ON_NAVIGATE_ABORT, {
          pageName,
          from: 'navigate',
        })
        return this.#onNavigateEnd({ pageName })
      }

      const components = this.render(
        pageSnapshot?.object?.components as NOODLComponent[],
      ) as ComponentInstance[]

      await this.emit(pageEvent.ON_COMPONENTS_RENDERED, {
        pageName,
        components,
      })

      this.#onNavigateEnd({ pageName })

      return {
        snapshot: Object.assign({ components }, pageSnapshot),
      }
    } catch (error) {
      await this.emit(pageEvent.ON_NAVIGATE_ERROR, { error, pageName })
      this.#onNavigateEnd({ error, pageName })
      throw new Error(error)
    }
  }

  /**
   * Encapsulates common cleanup operations when navigation is ending
   * !NOTE - Should not be called if an error occurred
   */
  #onNavigateEnd = ({
    error,
    pageName,
  }: {
    error?: boolean
    pageName?: string
  } = {}) => {
    this.setStatus(error ? pageStatus.NAVIGATE_ERROR : pageStatus.IDLE)
    // Remove the page modifiers so they don't propagate to subsequent navigates
    pageName && delete this.#state.modifiers[pageName]
  }

  /**
   * Takes a list of raw NOODL components and converts them into DOM nodes and appends
   * them to the DOM
   * @param { NOODLUIPage } page - Page in the shape of { name: string; object: null | PageObject }
   */
  render(rawComponents: ComponentCreationType | ComponentCreationType[]) {
    // Create the root node where we will be placing DOM nodes inside.
    // The root node is a direct child of document.body
    this.setStatus(pageStatus.RESOLVING_COMPONENTS)
    let resolved = noodlui.resolveComponents(rawComponents)
    this.setStatus(pageStatus.COMPONENTS_RECEIVED)
    const components = Array.isArray(resolved) ? resolved : [resolved]
    this.rootNode.innerHTML = ''
    this.setStatus(pageStatus.RENDERING_COMPONENTS)
    components.forEach((component) => {
      noodluidom.draw(component, this.rootNode)
    })
    this.setStatus(pageStatus.COMPONENTS_RENDERED)
    return components
  }

  getPreviousPage(startPage: string = this.getState().previous) {
    let previousPage
    let parts = this.pageUrl.split('-')
    if (parts.length > 1) {
      parts.pop()
      while (parts[parts.length - 1].endsWith('MenuBar') && parts.length > 1) {
        parts.pop()
      }
      if (parts.length > 1) {
        previousPage = parts[parts.length - 1]
      } else if (parts.length === 1) {
        if (parts[0].endsWith('MenuBar')) {
          previousPage = startPage
        } else {
          previousPage = parts[0].split('?')[1]
        }
      }
    } else {
      previousPage = startPage
    }
    return previousPage || ''
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
      Object.keys(fn).forEach((key) => ((config as any)[key] = fn[key]))
    }
    return config
  }

  on(
    event: T.PageEvent | T.PageStatus,
    fn: AnyFn | Partial<T.PageCallbackObjectConfig>,
  ) {
    if (!Array.isArray(this.#cbs[event])) this.#cbs[event] = []
    this.#cbs[event] = this.#cbs[event].concat(this.createCbConfig(fn))
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
    let objs = this.#cbs[event]
    if (objs?.length) {
      const numObjs = objs.length
      for (let index = 0; index < numObjs; index++) {
        const obj = objs[index]
        // Remove the observer if the consumer registered it as a "once"ified handler
        if (obj.once) objs.splice(objs.indexOf(obj), 1)
        // For now we will just use the first return value received
        // as the value to the caller that called emit if they are
        // expecting some value
        if (!result) result = await obj.fn(...args)
        else await obj.fn(...args)
      }
    }
    return result
  }

  emitSync(event: T.PageEvent | T.PageStatus, ...args: any[]) {
    let result
    let objs = this.#cbs[event]
    if (objs?.length) {
      const numObjs = objs.length
      for (let index = 0; index < numObjs; index++) {
        const obj = objs[index]
        // Remove the observer if the consumer registered it as a "once"ified handler
        if (obj.once) objs.splice(objs.indexOf(obj), 1)
        // For now we will just use the first return value received
        // as the value to the caller that called emit if they are
        // expecting some value
        if (!result) result = obj.fn(...args)
        else obj.fn(...args)
      }
    }
    return result
  }

  setStatus(status: T.PageStatus) {
    this.#state.status = status
    this.emitSync(status, status)
    if (status === pageStatus.IDLE) this.setRequestingPage('')
    else if (status === pageStatus.NAVIGATE_ERROR) this.setRequestingPage('')
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
