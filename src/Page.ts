import _ from 'lodash'
import Logger from 'logsnap'
import {
  IComponentType,
  IComponentTypeInstance,
  NOODLComponent,
  Page as NOODLUiPage,
} from 'noodl-ui'
import { NOODLDOMElement } from 'noodl-ui-dom'
import { openOutboundURL } from './utils/common'
import { PageModalState, PageSnapshot } from './app/types'
import noodlui from './app/noodl-ui'
import noodluidom from './app/noodl-ui-dom'
import Modal from './components/NOODLModal'

const log = Logger.create('Page.ts')

export type PageListenerName =
  | 'onStart'
  | 'onRootNodeInitialized'
  | 'onBeforePageRender'
  | 'onPageRendered'
  | 'onError'

export interface PageOptions {
  rootNode?: HTMLElement | null
  builtIn?: {
    [funcName: string]: any
  }
  renderer?(page: Page): { components: IComponentTypeInstance[] }
}

/**
 * This Page class is responsible for managing a NOODL page's state that is relative
 * to the page that is being presented to the user, like managing parsed components or
 * action chains that are running.
 */
class Page {
  previousPage: string = ''
  currentPage: string = ''
  #onStart: ((pageName: string) => Promise<any>) | undefined
  #onRootNodeInitialized:
    | ((rootNode: NOODLDOMElement | null) => Promise<any>)
    | undefined
  #onBeforePageRender:
    | ((options: {
        pageName: string
        rootNode: NOODLDOMElement | null
        pageModifiers: { evolve?: boolean } | undefined
      }) => Promise<any>)
    | undefined
  #onPageRendered:
    | ((options: {
        pageName: string
        components: IComponentTypeInstance[]
      }) => Promise<any>)
    | undefined
  #onPageRequest:
    | ((params: {
        previous: string
        current: string
        requested: string
        modifiers: { evolve?: boolean }
      }) => boolean)
    | undefined
  #onModalStateChange:
    | ((prevState: PageModalState, nextState: PageModalState) => void)
    | undefined
  #onError:
    | ((options: { error: Error; pageName: string }) => Promise<any>)
    | undefined
  private _initializeRootNode: () => void
  public builtIn: PageOptions['builtIn']
  public rootNode: HTMLElement | null = null
  public modal: Modal
  public requestingPage: string | undefined

  constructor({ builtIn, rootNode = null }: PageOptions = {}) {
    this.builtIn = builtIn
    this.rootNode = rootNode
    this.modal = new Modal()

    this._initializeRootNode = () => {
      const root = document.createElement('div')
      root.id = 'root'
      root.style.position = 'absolute'
      root.style.width = '100%'
      root.style.height = '100%'
      this.rootNode = root
      document.body.appendChild(root)
    }
  }

  initializeRootNode() {
    if (this.rootNode) return
    this._initializeRootNode()
  }

  /**
   * Navigates to the next page using pageName. It first prepares the rootNode
   * and begins parsing the NOODL components before rendering them to the rootNode.
   * Returns a snapshot of the page name, object, and its parsed/rendered components
   * @param { string } pageName
   * @param { boolean | undefined } pageModifiers.evolve - Set to false to disable the page's
   */
  public async navigate(
    pageName: string,
    pageModifiers: { evolve?: boolean; force?: boolean } = {},
  ): Promise<{ snapshot: PageSnapshot } | void> {
    // TODO: onTimedOut
    try {
      // Outside link
      if (_.isString(pageName) && pageName.startsWith('http')) {
        return openOutboundURL(pageName)
      }

      this['requestingPage'] = pageName

      await this.#onStart?.(pageName)

      // Create the root node where we will be placing DOM nodes inside.
      // The root node is a direct child of document.body
      if (!this.rootNode) {
        this.initializeRootNode()
        this.#onRootNodeInitialized?.(this.rootNode)
      }

      let pageSnapshot: NOODLUiPage | undefined
      let components: IComponentTypeInstance[] = []

      if (!pageName) {
        log.func('navigate')
        log.red('Cannot navigate because pageName is invalid', {
          pageName,
          rootNode: this.rootNode,
        })
        window.alert(`The value of page "${pageName}" is not valid`)
      } else {
        // The caller is expected to provide their own page object
        pageSnapshot = await this.#onBeforePageRender?.({
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

        this.#onPageRendered?.({
          pageName,
          components: rendered.components,
        })

        if (_.isArray(rendered.components)) {
          components = rendered.components
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
        snapshot: _.assign({ components }, pageSnapshot),
      }
    } catch (error) {
      if (_.isFunction(this.#onError)) {
        this.#onError?.({ error, pageName })
      } else {
        throw new Error(error)
      }
    }
  }

  /**
   * Requests to change the page to another page. The caller needs to register the
   * handler by setting page.onPageRequest = ({previous,current,requested}) => {...}
   * If the call returns true, the page will begin navigating to the next page
   * else it will do nothing
   * @param { string } requestedPage - Page name to request
   * @param { boolean? } modifiers.evolve - Set to false to disable the sdk's "evolve" for this route change. It internally set to true by default
   */
  requestPageChange(
    newPage: string,
    modifiers: { evolve?: boolean; force?: boolean } = {},
  ) {
    if (
      newPage !== this.currentPage ||
      newPage.startsWith('http') ||
      modifiers.force
    ) {
      const shouldNavigate = this.#onPageRequest?.({
        previous: this.previousPage,
        current: this.currentPage,
        requested: newPage,
        modifiers,
      })
      if (shouldNavigate === true) {
        return this.navigate(newPage, modifiers).then(() => {
          this.previousPage = this.currentPage
          this.currentPage = newPage
        })
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
    this?.onModalStateChange?.(prevState, nextState)
  }

  closeModal() {
    //
  }

  set onStart(fn: (pageName: string) => Promise<any>) {
    this.#onStart = fn
  }

  set onRootNodeInitialized(
    fn: (rootNode: NOODLDOMElement | null) => Promise<any>,
  ) {
    this.#onRootNodeInitialized = fn
  }

  set onBeforePageRender(
    fn: (options: {
      pageName: string
      rootNode: NOODLDOMElement | null
      pageModifiers: { evolve?: boolean } | undefined
    }) => Promise<NOODLUiPage | undefined>,
  ) {
    this.#onBeforePageRender = fn
  }

  set onPageRendered(
    fn: (options: {
      pageName: string
      components: IComponentTypeInstance[]
    }) => Promise<any>,
  ) {
    this.#onPageRendered = fn
  }

  get onPageRequest() {
    return this.#onPageRequest
  }

  set onPageRequest(fn) {
    this.#onPageRequest = fn
  }

  get onModalStateChange() {
    return this.#onModalStateChange
  }

  set onModalStateChange(fn) {
    this.#onModalStateChange = fn
  }

  set onError(
    fn: (options: { error: Error; pageName: string }) => Promise<any>,
  ) {
    this.#onError = fn
  }

  /**
   * Returns the link to the main dashboard page by using the noodl base url
   * @param { string } baseUrl - Base url retrieved from the noodl config
   */
  public async getDashboardPath() {
    const { getPagePath } = await import('./utils/sdkHelpers')
    return getPagePath(/meeting/)
  }

  /**
   * Takes a list of raw NOODL components and converts them into DOM nodes and appends
   * them to the DOM
   * @param { NOODLUIPage } page - Page in the shape of { name: string; object: null | NOODLPageObject }
   */
  public render(rawComponents: IComponentType | IComponentType[]) {
    let resolved = noodlui.resolveComponents(rawComponents)
    const components = _.isArray(resolved) ? resolved : [resolved]
    if (this.rootNode) {
      // Clean up previous nodes
      this.rootNode.innerHTML = ''
      _.forEach(components, (component) => {
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
  public getNodes() {
    return {
      rootNode: this.rootNode,
    }
  }

  public setBuiltIn(builtIn: any) {
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
}

export default Page
