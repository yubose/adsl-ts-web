import { Page as NUIPage } from 'noodl-ui'
import { ComponentObject } from 'noodl-types'
import { eventId } from './constants'
import * as u from './utils/internal'
import * as T from './types'

const getDefaultRenderState = (
  initialState?: Record<string, any>,
): T.Page.State['render'] => ({
  lastTop: {
    value: 0,
    componentIds: [],
  },
  ...initialState,
})

class Page {
  #nuiPage: NUIPage
  #state: T.Page.State = {
    previous: '',
    requesting: '',
    modifiers: {} as {
      [pageName: string]: { reload?: boolean } & Record<string, any>
    },
    reqQueue: [],
    status: eventId.page.status.IDLE as T.Page.Status,
    rootNode: false,
    render: getDefaultRenderState(),
  }
  #hooks = u
    .values(eventId.page.on)
    .reduce((acc, key) => u.assign(acc, { [key]: [] }), {}) as Record<
    T.Page.HookEvent,
    T.Page.HookDescriptor[]
  >
  components: ComponentObject[] = []
  pageUrl: string = 'index.html?'
  rootNode: HTMLDivElement
  ref: {
    request: {
      name: string
      timer: NodeJS.Timeout | null
    }
  } = { request: { name: '', timer: null } };

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      ...this.snapshot(),
      id: this.id,
      nuiPage: this.#nuiPage,
      pageUrl: this.pageUrl,
      viewport: { width: this.viewport.width, height: this.viewport.height },
    }
  }

  constructor(nuiPage: NUIPage) {
    this.#nuiPage = nuiPage
    this.clearRootNode()
  }

  clearRootNode() {
    if (!this.rootNode) {
      this.rootNode = document.createElement('div')
      this.rootNode.id = this.id as string
    }
    this.rootNode.innerHTML = ''
    this.rootNode.style.cssText = ''
    this.rootNode.style.position = 'absolute'
    this.rootNode.style.width = '100%'
    this.rootNode.style.height = '100%'
    if (!document.body.contains(this.rootNode)) {
      document.body.appendChild(this.rootNode)
    }
    return this
  }

  get hooks() {
    return this.#hooks
  }

  get id() {
    return this.#nuiPage.id
  }

  get modifiers() {
    if (!this.#state.modifiers) this.#state.modifiers = {}
    return this.state.modifiers
  }

  get page() {
    return (this.#nuiPage?.page as string) || ''
  }

  set page(page: string) {
    this.#nuiPage.page = page || ''
  }

  get previous() {
    return this.#state.previous
  }

  set previous(pageName: string) {
    this.#state.previous = pageName || ''
  }

  get requesting() {
    return this.#state.requesting
  }

  set requesting(pageName: string) {
    this.#state.requesting = pageName || ''
  }

  get state() {
    return this.#state
  }

  get viewport() {
    return this.#nuiPage.viewport
  }

  set viewport(viewport) {
    this.#nuiPage.viewport = viewport
  }

  getNuiPage() {
    return this.#nuiPage
  }

  isEqual(val: NUIPage | Page) {
    return val === this.getNuiPage() || val === this
  }

  getCbs() {
    return this.hooks
  }

  clearCbs() {
    u.values(this.hooks).forEach((arr) => {
      while (arr.length) arr.pop()
    })
    return this
  }

  getState() {
    return this.#state
  }

  getPreviousPage(startPage: string = this.state.previous) {
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
      previous: this.state.previous,
      current: this.page,
      requesting: this.state.requesting,
      ...opts,
    }
  }

  on<K extends T.Page.HookEvent>(evt: K, fn: T.Page.Hook[K]) {
    if (this.hooks[evt] && !this.hooks[evt].some((o) => o.id === evt)) {
      this.hooks[evt].push({ id: evt, fn })
    }
    return this
  }

  off<K extends T.Page.HookEvent>(evt: K, fn: T.Page.Hook[K]) {
    const index = this.hooks[evt]?.findIndex?.((o) => o.fn === fn) || -1
    if (index !== -1) this.hooks[evt].splice(index, 1)
    return this
  }

  once<Evt extends T.Page.HookEvent>(evt: Evt, fn: T.Page.Hook[Evt]) {
    const descriptor: T.Page.HookDescriptor<Evt> = { id: evt, once: true, fn }
    this.hooks[evt].push(descriptor)
    return this
  }

  async emitAsync<K extends T.Page.HookEvent>(
    evt: K,
    ...args: Parameters<T.Page.Hook[K]>
  ) {
    let results
    if (u.isArr(this.hooks[evt])) {
      results = await Promise.all(
        this.hooks[evt].map((o) => (o.fn as any)(...args)),
      )
    }
    return results ? results.find(Boolean) : results
  }

  emitSync<K extends T.Page.HookEvent>(
    evt: K,
    ...args: Parameters<T.Page.Hook[K]>
  ) {
    this.hooks[evt]?.forEach?.((d, index) => {
      d.fn?.call?.(this, ...args)
      if (d.once) this.hooks[evt].splice(index, 1)
    })
    return this
  }

  setStatus(status: T.Page.Status) {
    this.#state.status = status
    if (status === eventId.page.status.IDLE) this.requesting = ''
    else if (status === eventId.page.status.NAVIGATE_ERROR) this.requesting = ''
    this.emitSync(eventId.page.on.ON_STATUS_CHANGE, status)
    return this
  }

  setPreviousPage(name: string) {
    this.#state.previous = name
    return this
  }

  setModifier(page: string, obj: { [key: string]: any }) {
    if (!this.#state.modifiers[page]) this.#state.modifiers[page] = {}
    u.assign(this.#state.modifiers[page], obj)
    return this
  }

  reset<K extends keyof T.Page.State = keyof T.Page.State>(slice?: K) {
    if (slice) {
      if (slice === 'render') this.#state.render = getDefaultRenderState()
    }
  }

  isStale(pageName: string) {
    const getQueue = () => this.#state.reqQueue

    while (getQueue().length > 1) {
      const removed = getQueue().pop()
      console.log(
        `%cRemoved ${removed} from reqQueue`,
        `color:#00b406;`,
        getQueue(),
      )
    }

    if (getQueue().length <= 1) {
      return !getQueue().includes(pageName)
    }

    return getQueue()[0] === pageName
  }
}

export default Page
