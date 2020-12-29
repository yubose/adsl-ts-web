import Logger from 'logsnap'
import {
  Component,
  ComponentCreationType,
  ComponentInstance,
  NOODLComponent,
  Page as NOODLUiPage,
} from 'noodl-ui'
import { NOODLDOMElement } from 'noodl-ui-dom'
import { openOutboundURL } from './utils/common'
import { PageModalState } from './app/types'
import noodlui from './app/noodl-ui'
import noodluidom from './app/noodl-ui-dom'
import Modal from './components/NOODLModal'

const log = Logger.create('Page.ts')

export type PageEvent =
  | 'start'
  | 'root-node'
  | 'before-page-render'
  | 'page-rendered'
  | 'error'
  | 'modal-state-change'

export interface PageOptions {
  _log?: boolean
  rootNode: HTMLDivElement
  builtIn?: {
    [funcName: string]: any
  }
  renderer?(page: Page): { components: Component[] }
}

export type IPage = Page

/**
 * This Page class is responsible for managing a NOODL page's state that is relative
 * to the page that is being presented to the user, like managing parsed components or
 * action chains that are running.
 */
class Page {
  private _initializeRootNode: () => void
  #cbs = {} as Record<PageEvent, ((...args: any[]) => Promise<any> | any)[]>
  previousPage: string = ''
  currentPage: string = ''
  pageUrl: string = 'index.html?'
  builtIn: PageOptions['builtIn']
  rootNode: HTMLElement | null = null
  modal: Modal
  requestingPage: string | undefined
  requestingPageModifiers: { reload?: boolean } = {}
  onRendered: {
    on: 'load'
    once?: boolean
    fn: (...args: any[]) => any
  }[] = []

  constructor({ _log = true, builtIn }: PageOptions = {}) {
    this.builtIn = builtIn
    this.modal = new Modal()
    _log === false && Logger.disable()

    this._initializeRootNode = () => {
      if (this.rootNode === null) {
        this.rootNode = document.createElement('div')
      }
      this.rootNode.id = 'root'
      this.rootNode.style.position = 'absolute'
      this.rootNode.style.width = '100%'
      this.rootNode.style.height = '100%'
      if (!document.body.contains(this.rootNode)) {
        document.body.appendChild(this.rootNode)
      }
    }

    this.initializeRootNode()
  }

  initializeRootNode() {
    if (this.rootNode !== null) return
    this._initializeRootNode()
  }

  /**
   * Navigates to the next page using pageName. It first prepares the rootNode
   * and begins parsing the NOODL components before rendering them to the rootNode.
   * Returns a snapshot of the page name, object, and its parsed/rendered components
   * @param { string } pageName
   * @param { boolean | undefined } pageModifiers.reload - Set to false to disable the page's
   */
  async navigate(
    pageName: string,
    pageModifiers: { reload?: boolean; force?: boolean } = {},
  ): Promise<{ snapshot: any } | void> {
    // TODO: onTimedOut
    try {
      // Outside link
      if (typeof pageName === 'string' && pageName.startsWith('http')) {
        return openOutboundURL(pageName)
      }

      // if(!noodl.root.Global.currentUser.vertex.sk) {
      //   pageName = noodl.cadlEndpoint.startPage
      // }

      this['requestingPage'] = pageName

      await this.emit('start', pageName)

      // Create the root node where we will be placing DOM nodes inside.
      // The root node is a direct child of document.body
      if (!this.rootNode) {
        this.initializeRootNode()
        await this.emit('root-node', this.rootNode)
      }

      let pageSnapshot: NOODLUiPage | undefined
      let components: Component[] = []

      if (!pageName) {
        log.func('navigate')
        log.red('Cannot navigate because pageName is invalid', {
          pageName,
          rootNode: this.rootNode,
        })
      } else {
        // The caller is expected to provide their own page object
        const pageSnapshot = await this.emit('before-page-render', {
          pageName,
          rootNode: this.rootNode,
          pageModifiers,
        })

        // Sometimes a navigate request coming from another location like a
        // "goto" action can invoke a request in the middle of this operation.
        // Give the latest call the priority
        if (this.requestingPage && this.requestingPage !== pageName) {
          log.grey(
            `Aborting this navigate request for ${pageName} because a more ` +
              `recent request to "${this.requestingPage}" was called`,
            { pageAborting: pageName, pageRequesting: this.requestingPage },
          )
          return
        }

        const rendered = this.render(
          pageSnapshot?.object?.components as NOODLComponent[],
        )

        await this.emit('page-rendered', {
          pageName,
          components: rendered.components,
        })

        if (Array.isArray(rendered.components)) {
          components = rendered.components as any
        } else {
          log.func('navigate')
          log.red(
            `The page ${pageName} was not parsed correctly. Expected to receive components as an array`,
            { pageSnapshot, expectedRender: rendered },
          )
        }
      }

      this.requestingPage = undefined

      return {
        snapshot: Object.assign({ components }, pageSnapshot),
      }
    } catch (error) {
      await this.emit('error', { error, pageName })
      throw new Error(error)
    }
  }

  /**
   * Requests to change the page to another page. The caller needs to register the
   * handler by setting page.onPageRequest = ({previous,current,requested}) => {...}
   * If the call returns true, the page will begin navigating to the next page
   * else it will do nothing
   * @param { string } requestedPage - Page name to request
   * @param { boolean? } modifiers.reload - Set to false to disable the sdk's "reload" for this route change. It internally set to true by default
   */
  async requestPageChange(
    newPage: string,
    modifiers: { reload?: boolean; force?: boolean } = {},
    goback: boolean = false,
  ) {
    if (
      newPage !== this.currentPage ||
      newPage.startsWith('http') ||
      modifiers.force
    ) {
      if (goback) {
        modifiers.reload = modifiers.reload === false ? false : true
        history.pushState({}, '', this.pageUrl)
        await this.navigate(newPage, modifiers)
        this.previousPage = this.currentPage
        this.currentPage = newPage
      } else {
        history.pushState({}, '', this.pageUrl)
        await this.navigate(newPage, modifiers)
        this.previousPage = this.currentPage
        this.currentPage = newPage
      }
    } else {
      log.func('changePage')
      log.orange(
        'Skipped the request to change page because we are already on the page',
        {
          previousPage: this.previousPage,
          currentPage: this.currentPage,
          requestedPage: newPage,
        },
      )
    }
  }

  openModal(
    { id = '', ...options }: Partial<PageModalState>,
    content: HTMLElement | NOODLDOMElement | string | number | undefined,
  ) {
    const prevState = this.modal.getState()
    this.modal.open(id, content, options as PageModalState)
    const nextState = this.modal.getState()
    this.emit('modal-state-change', prevState, nextState)
  }

  closeModal() {
    //
  }

  /**
   * Returns the link to the main dashboard page by using the noodl base url
   * @param { string } baseUrl - Base url retrieved from the noodl config
   */
  async getDashboardPath() {
    const { getPagePath } = await import('./utils/sdkHelpers')
    return getPagePath(/meeting/)
  }

  /**
   * Takes a list of raw NOODL components and converts them into DOM nodes and appends
   * them to the DOM
   * @param { NOODLUIPage } page - Page in the shape of { name: string; object: null | PageObject }
   */
  render(rawComponents: ComponentCreationType | ComponentCreationType[]) {
    let resolved = noodlui.resolveComponents(rawComponents)
    const components = Array.isArray(resolved) ? resolved : [resolved]
    if (this.rootNode) {
      // Clean up previous nodes
      this.rootNode.innerHTML = ''
      // this.rootNode.remove()
      this.initializeRootNode()
      components.forEach((component) => {
        noodluidom.parse(component, this.rootNode)
      })
    } else {
      log.func('navigate')
      log.red(
        "Attempted to render the page's components but the root " +
          'node was not initialized. The page will not show anything',
        { rootNode: this.rootNode },
      )
    }

    return {
      components,
    }
  }

  /**
   *  Returns a JS representation of the current rootNode and nodes of the
   * current page
   */
  getNodes() {
    return {
      rootNode: this.rootNode,
    }
  }

  setBuiltIn(builtIn: any) {
    this.builtIn = builtIn
    return this
  }

  /** Returns a JS representation of the current state of this page instance */
  snapshot() {
    return {
      modalState: this.modal.getState(),
      previousPage: this.previousPage,
      currentPage: this.currentPage,
      ...this.getNodes(),
    }
  }

  on(event: 'start', fn: (page: string) => Promise<void> | void): this
  on(
    event: 'root-node',
    fn: (node: HTMLDivElement) => Promise<void> | void,
  ): this
  on(
    event: 'before-page-render',
    fn: (args: {
      pageName: string
      pageModifiers: { force?: boolean; reload?: boolean }
    }) => Promise<void> | void,
  ): this
  on(
    event: 'page-rendered',
    fn: (args: {
      pageName: string
      components: ComponentInstance[]
    }) => Promise<void> | void,
  ): this
  on(
    event: 'error',
    fn: (args: { error: Error; pageName: string }) => Promise<void> | void,
  ): this
  on(
    event: 'modal-state-change',
    fn: (
      prevState: PageModalState,
      nextState: PageModalState,
    ) => Promise<void> | void,
  ): this
  on(eventName: string, fn: (...args: any[]) => Promise<any> | any) {
    switch (eventName) {
      case 'start':
      case 'root-node':
      case 'before-page-render':
      case 'page-rendered':
      case 'error':
      case 'modal-state-change':
        if (!Array.isArray(this.#cbs[eventName])) this.#cbs[eventName] = []
        if (!this.#cbs[eventName].includes(fn)) {
          this.#cbs[eventName].push(fn)
        }
    }
    return this
  }

  async emit(event: PageEvent, ...args: any[]) {
    let result
    const fns = this.#cbs[event]
    if (fns.length) {
      const numFns = fns.length
      for (let index = 0; index < numFns; index++) {
        const fn = fns[index]
        // For now we will just use the first return value received
        // as the value to the caller that called emit if they are
        // expecting some value
        if (!result) result = await fn(...args)
      }
    }
    return result
  }
}

export default Page
