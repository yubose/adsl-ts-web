import Logger from 'logsnap'
import pick from 'lodash/pick'
import { ComponentInstance, Viewport } from 'noodl-ui'
import { ComponentObject } from 'noodl-types'
import { openOutboundURL } from './utils'
import { eventId } from './constants'
import * as u from './utils/internal'
import * as T from './types'

const log = Logger.create('Page')

class Page {
  #state: T.Page.State = {
    current: '',
    previous: '',
    requesting: '',
    modifiers: {} as {
      [pageName: string]: { reload?: boolean } & Record<string, any>
    },
    status: eventId.page.status.IDLE as T.Page.Status,
    rootNode: false,
    render: u.getDefaultRenderState(),
  }
  #hooks = u
    .keys(eventId.page.on)
    .reduce(
      (acc, key) => u.assign(acc, { [eventId.page.on[key]]: [] }),
      {},
    ) as Record<T.Page.HookEvent, T.Page.HookDescriptor[]>
  #render: T.Render.Func | undefined
  #viewport = {} as Viewport
  pageUrl: string = 'index.html?'
  rootNode: HTMLBodyElement
  ref: {
    request: {
      name: string
      timer: NodeJS.Timeout | null
    }
  } = { request: { name: '', timer: null } }

  constructor(render?: T.Render.Func | undefined) {
    if (render) this.render = render
    // this.rootNode = document.createElement('div')
    this.rootNode = document.body as HTMLBodyElement
    this.rootNode.id = 'root'
    this.rootNode.style.position = 'absolute'
    this.rootNode.style.width = '100%'
    this.rootNode.style.height = '100%'
    // if (!document.body.contains(this.rootNode))
    // document.body.appendChild(this.rootNode)
  }

  get hooks() {
    return this.#hooks
  }

  get render() {
    return this.#render as T.Render.Func
  }

  set render(fn: T.Render.Func) {
    this.#render = fn
  }

  get state() {
    return this.#state
  }

  get viewport() {
    return this.#viewport
  }

  set viewport(viewport) {
    this.#viewport = viewport
  }

  getCbs() {
    return this.#hooks
  }

  clearCbs() {
    u.values(this.#hooks).forEach((arr) => {
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
    // if (this.ref.request.name === newPage && this.ref.request.timer) {
    //   log.func('requestPageChange')
    //   await this.emit(eventId.page.on.ON_NAVIGATE_ABORT, {
    //     ...this.snapshot(),
    //     reason: 'debounced',
    //     from: 'requestPageChange',
    //   })
    //   return log.orange(
    //     `Aborted the request to "${newPage}" because a previous request ` +
    //       `to the same page was just requested`,
    //     this.snapshot(),
    //   )
    // }
    console.log(newPage)
    if (newPage) {
      this.ref.request.timer && clearTimeout(this.ref.request.timer)
      this.setRequestingPage(newPage, { delay })
      if (process.env.NODE_ENV !== 'test') {
        history.pushState({}, '', this.pageUrl)
      }
      const snapshot = await this.navigate(newPage)
      this.setPreviousPage(this.getState().current)
      this.setCurrentPage(newPage)
      return snapshot || { snapshot: null }
    }
    return { snapshot: null }
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
      if (pageName?.startsWith?.('http')) {
        await this.emitAsync(
          eventId.page.on.ON_OUTBOUND_REDIRECT,
          this.snapshot(),
        )
        openOutboundURL(pageName)
        return this.#onNavigateEnd({ pageName })
      }

      // TODO - Put a page checker here

      await this.emitAsync(eventId.page.on.ON_NAVIGATE_START, this.snapshot())

      const requesting = this.getState().requesting

      // Sometimes a navigate request coming from another location like a
      // "goto" action can invoke a request in the middle of this operation.
      // Give the latest call the priority
      if (this.getState().requesting !== pageName) {
        log.orange(
          `Aborting this navigate request for ${pageName} because a more ` +
            `recent request to "${requesting}" was called`,
          { pageAborting: pageName, pageRequesting: requesting },
        )
        await this.emitAsync(eventId.page.on.ON_NAVIGATE_ABORT, this.snapshot())
        return this.#onNavigateEnd({ pageName })
      }

      // The caller is expected to provide their own page object
      const pageSnapshot = await this.emitAsync(
        eventId.page.on.ON_BEFORE_RENDER_COMPONENTS,
        this.snapshot({ ref: this.ref }),
      )

      if (pageSnapshot === 'old.request') {
        await this.emitAsync(eventId.page.on.ON_NAVIGATE_ABORT, this.snapshot())
        return
      }

      this.setStatus(eventId.page.status.SNAPSHOT_RECEIVED)

      const components = this.render(
        pageSnapshot?.object?.components as ComponentObject[],
      ) as ComponentInstance[]

      await this.emitAsync(
        eventId.page.on.ON_COMPONENTS_RENDERED,
        this.snapshot({ components }) as T.Page.Snapshot & {
          components: ComponentInstance[]
        },
      )

      this.#onNavigateEnd({ pageName })

      return {
        snapshot: { ...pageSnapshot, components },
      }
    } catch (error) {
      await this.emitAsync(
        eventId.page.on.ON_NAVIGATE_ERROR,
        this.snapshot({ error }) as T.Page.Snapshot & { error: Error },
      )
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
  snapshot(opts?: Record<string, any>) {
    return {
      status: this.state.status,
      previous: this.state.status,
      current: this.state.current,
      requesting: this.state.requesting,
      ...opts,
    }
  }

  on<K extends T.Page.HookEvent>(evt: K, fn: T.Page.Hook[K]) {
    if (this.#hooks[evt] && !this.#hooks[evt].some((o) => o.id === evt)) {
      this.#hooks[evt].push({ id: evt, fn })
    }
    return this
  }

  off<K extends T.Page.HookEvent>(evt: K, fn: T.Page.Hook[K]) {
    const index = this.#hooks[evt]?.findIndex?.((o) => o.fn === fn) || -1
    if (index !== -1) this.#hooks[evt].splice(index, 1)
    return this
  }

  once<Evt extends T.Page.HookEvent>(evt: Evt, fn: T.Page.Hook[Evt]) {
    const descriptor: T.Page.HookDescriptor<Evt> = { id: evt, once: true, fn }
    this.#hooks[evt].push(descriptor)
    return this
  }

  async emitAsync<K extends T.Page.HookEvent>(
    evt: K,
    ...args: Parameters<T.Page.Hook[K]>
  ) {
    let results
    console.log(this.#hooks[evt])
    if (u.isArr(this.#hooks[evt])) {
      results = await Promise.all(
        this.#hooks[evt].map((o) => (o.fn as any)(...args)),
      )
    }
    return results ? results.find(Boolean) : results
  }

  emitSync<K extends T.Page.HookEvent>(
    evt: K,
    ...args: Parameters<T.Page.Hook[K]>
  ) {
    this.#hooks[evt]?.forEach?.((d, index) => {
      d.fn?.call?.(this, ...args)
      if (d.once) this.#hooks[evt].splice(index, 1)
    })
    return this
  }

  setStatus(status: T.Page.Status) {
    this.#state.status = status
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
    u.assign(this.#state.modifiers[page], obj)
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
}

export default Page
