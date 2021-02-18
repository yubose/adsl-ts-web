import Logger from 'logsnap'
import pick from 'lodash/pick'
import { ComponentInstance, NOODLComponent } from 'noodl-ui'
import { PageObject } from 'noodl-types'
import { createEmptyObjectWithKeys, openOutboundURL } from './utils'
import { eventId } from './constants'
import * as T from './types'

const log = Logger.create('Page')

class Page {
  #state = {
    current: '',
    previous: '',
    requesting: '',
    modifiers: {} as {
      [pageName: string]: { reload?: boolean } & {
        [key: string]: any
      }
    },
    status: eventId.page.status.IDLE as T.PageStatus,
    rootNode: false,
  }
  #cbs = {
    ...createEmptyObjectWithKeys(
      Object.values(eventId.page.on),
      [] as T.PageCallbackObjectConfig[],
    ),
    ...createEmptyObjectWithKeys(
      Object.values(eventId.page.status),
      [] as T.PageCallbackObjectConfig[],
    ),
  }
  #render: T.Render | undefined
  pageUrl: string = 'index.html?'
  rootNode: HTMLDivElement
  ref: {
    request: {
      name: string
      timer: NodeJS.Timeout | null
    }
  } = { request: { name: '', timer: null } }

  constructor(render?: T.Render | undefined) {
    if (render) this.render = render
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
   * @param { boolean | undefined } options.reload - Parameter for NOODL's evolve
   * @param { number | undefined } options.delay - Request debouncing delay (defaults to 800 (ms))
   */
  async requestPageChange(
    newPage: string = '',
    { delay }: { reload?: boolean; delay?: number } = {},
  ) {
    console.info(this.snapshot())
    if (this.ref.request.name === newPage && this.ref.request.timer) {
      log.func('requestPageChange')
      await this.emit(eventId.page.on.ON_NAVIGATE_ABORT, {
        ...this.snapshot(),
        reason: 'debounced',
        from: 'requestPageChange',
      })
      return log.orange(
        `Aborted the request to "${newPage}" because a previous request ` +
          `to the page was just requested`,
        this.snapshot(),
      )
    }

    if (newPage) {
      this.ref.request.timer && clearTimeout(this.ref.request.timer)
      this.setRequestingPage(newPage, { delay })
      if (process.env.NODE_ENV !== 'test') {
        history.pushState({}, '', this.pageUrl)
      }
      await this.navigate(newPage)
      this.setPreviousPage(this.getState().current)
      this.setCurrentPage(newPage)
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
      if (!this.render)
        throw new Error(
          'Cannot navigate without a renderer. ' +
            'Pass one in by directing setting the "render" property',
        )
      this.setStatus(eventId.page.status.NAVIGATING)

      // Outside link
      if (typeof pageName === 'string' && pageName?.startsWith('http')) {
        await this.emit(eventId.page.on.ON_OUTBOUND_REDIRECT, this.snapshot())
        openOutboundURL(pageName)
        return this.#onNavigateEnd({ pageName })
      }

      // TODO - Put a page checker here

      await this.emit(eventId.page.on.ON_NAVIGATE_START, this.snapshot())

      const requestingPage = this.getState().requesting

      // Sometimes a navigate request coming from another location like a
      // "goto" action can invoke a request in the middle of this operation.
      // Give the latest call the priority
      if (this.getState().requesting !== pageName) {
        log.orange(
          `Aborting this navigate request for ${pageName} because a more ` +
            `recent request to "${requestingPage}" was called`,
          { pageAborting: pageName, pageRequesting: requestingPage },
        )
        await this.emit(eventId.page.on.ON_NAVIGATE_ABORT, {
          ...this.snapshot(),
          pageName,
          from: 'navigate',
        })
        return this.#onNavigateEnd({ pageName })
      }

      // The caller is expected to provide their own page object
      const pageSnapshot = (await this.emit(
        eventId.page.on.ON_BEFORE_RENDER_COMPONENTS,
        this.snapshot(),
      )) as Record<string, PageObject> | 'old.request'

      if (pageSnapshot === 'old.request') {
        return
      }

      this.setStatus(eventId.page.status.SNAPSHOT_RECEIVED)

      const components = this.render(
        pageSnapshot?.object?.components as NOODLComponent[],
      ) as ComponentInstance[]

      await this.emit(eventId.page.on.ON_COMPONENTS_RENDERED, {
        ...this.snapshot(),
        pageName,
        components,
      })

      this.#onNavigateEnd({ pageName })

      return {
        snapshot: Object.assign({ components }, pageSnapshot),
      }
    } catch (error) {
      await this.emit(eventId.page.on.ON_NAVIGATE_ERROR, {
        error,
        pageName,
        ...this.snapshot(),
      })
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
    this.setStatus(
      error ? eventId.page.status.NAVIGATE_ERROR : eventId.page.status.IDLE,
    )
    // Remove the page modifiers so they don't propagate to subsequent navigates
    pageName && delete this.#state.modifiers[pageName]
  }

  getPreviousPage(startPage: string = this.getState().previous) {
    let previousPage
    let parts = this.pageUrl.split('-')
    if (parts.length > 1) {
      parts.pop()
      while (parts[parts.length - 1]?.endsWith('MenuBar') && parts.length > 1) {
        parts.pop()
      }
      if (parts.length > 1) {
        previousPage = parts[parts.length - 1]
      } else if (parts.length === 1) {
        if (parts[0]?.endsWith('MenuBar')) {
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
      ref: this.ref,
    }
  }

  createCbConfig(
    config: Partial<T.PageCallbackObjectConfig>,
  ): T.PageCallbackObjectConfig
  createCbConfig(fn: T.AnyFn): T.PageCallbackObjectConfig
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
    fn: T.AnyFn | Partial<T.PageCallbackObjectConfig>,
  ) {
    if (!Array.isArray(this.#cbs[event])) this.#cbs[event] = []
    this.#cbs[event] = this.#cbs[event].concat(this.createCbConfig(fn as any))
    return this
  }

  once(
    event: T.PageEvent | T.PageStatus,
    config: Partial<T.PageCallbackObjectConfig>,
  ): this
  once(event: T.PageEvent | T.PageStatus, fn: T.AnyFn): this
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
    if (status === eventId.page.status.IDLE) this.setRequestingPage('')
    else if (status === eventId.page.status.NAVIGATE_ERROR)
      this.setRequestingPage('')
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

  setRequestingPage(name: string, { delay = 800 }: { delay?: number } = {}) {
    this.#state.requesting = name
    this.ref.request.name = name
    this.ref.request.timer = setTimeout(() => {
      this.ref.request.name = ''
      this.ref.request.timer = null
    }, delay)
    return this
  }

  get render() {
    return this.#render as T.Render
  }

  set render(fn: T.Render) {
    this.#render = fn
  }
}

export default Page
