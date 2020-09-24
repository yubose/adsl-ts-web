import _ from 'lodash'
import {
  NOODLComponent,
  NOODLComponentProps,
  Page as NOODLUiPage,
} from 'noodl-ui'
import { openOutboundURL } from './utils/common'
import { noodl } from './app/client'
import { NOODLElement, PageSnapshot } from './app/types'
import { getPagePath } from './utils/sdkHelpers'
import parser from './utils/parser'
import Modal from './components/NOODLModal'
import Logger from './app/Logger'
import { noodlDomParserEvents } from './constants'

const log = Logger.create('Page.ts')

export type PageListenerName =
  | 'onStart'
  | 'onCreateNode'
  | 'onRootNodeInitializing'
  | 'onRootNodeInitialized'
  | 'onBeforePageRender'
  | 'onCreateNode'
  | 'onPageRendered'
  | 'onError'

export interface PageOptions {
  rootNode?: HTMLElement | null
  nodes?: HTMLElement[] | null
  builtIn?: {
    [funcName: string]: any
  }
  renderer?(page: Page): { components: NOODLComponentProps[] }
}

/**
 * This Page class is responsible for managing a NOODL page's state that is relative
 * to the page that is being presented to the user, like managing parsed components or
 * action chains that are running.
 */
class Page {
  #onStart: ((pageName: string) => Promise<any>) | undefined
  #onCreateNode:
    | ((node: NOODLElement, props: NOODLComponentProps) => Promise<any>)
    | undefined
  #onRootNodeInitializing: (() => Promise<any>) | undefined
  #onRootNodeInitialized:
    | ((rootNode: NOODLElement | null) => Promise<any>)
    | undefined
  #onBeforePageRender:
    | ((options: {
        pageName: string
        rootNode: NOODLElement | null
      }) => Promise<any>)
    | undefined
  #onPageRendered:
    | ((options: {
        pageName: string
        components: NOODLComponentProps[]
      }) => Promise<any>)
    | undefined
  #onError:
    | ((options: { error: Error; pageName: string }) => Promise<any>)
    | undefined
  private _initializeRootNode: () => void
  public builtIn: PageOptions['builtIn']
  public rootNode: HTMLElement | null = null
  public nodes: HTMLElement[] | null
  public modal: Modal

  constructor({ builtIn, rootNode = null, nodes = null }: PageOptions = {}) {
    this.builtIn = builtIn
    this.rootNode = rootNode
    this.nodes = nodes
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

    parser.on(
      noodlDomParserEvents.onCreateNode,
      (node: NOODLElement, props: NOODLComponentProps) => {
        if (_.isFunction(this.#onCreateNode)) {
          this.#onCreateNode(node, props)
        }
      },
    )
  }

  /**
   * Navigates to the next page using pageName. It first prepares the rootNode
   * and begins parsing the NOODL components before rendering them to the rootNode.
   * Returns a snapshot of the page name, object, and its parsed/rendered components
   * @param { string } pageName
   */
  public async navigate(
    pageName: string,
  ): Promise<{ snapshot: PageSnapshot } | void> {
    // TODO: onTimedOut
    try {
      // Outside link
      if (_.isString(pageName) && pageName.startsWith('http')) {
        return openOutboundURL(pageName)
      }

      log.func('navigate').grey(`Rendering the DOM for page: "${pageName}"`)

      await this.#onStart?.(pageName)

      /** Handle the root node */
      if (!this.rootNode) {
        this.#onRootNodeInitializing?.()
        this._initializeRootNode()
        if (this.rootNode) {
          this.#onRootNodeInitialized?.(this.rootNode)
        }
      }

      let pageSnapshot: NOODLUiPage | undefined
      let components: NOODLComponentProps[] = []

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
        })

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

      return {
        snapshot: _.assign({ components: components }, pageSnapshot),
      }
    } catch (error) {
      if (_.isFunction(this.#onError)) {
        this.#onError?.({ error, pageName })
      } else {
        throw new Error(error)
      }
    }
  }

  set onStart(fn: (pageName: string) => Promise<any>) {
    this.#onStart = fn
  }

  set onCreateNode(
    fn: (node: NOODLElement, props: NOODLComponentProps) => any,
  ) {
    this.#onCreateNode = fn
  }

  set onRootNodeInitializing(fn: () => Promise<any>) {
    this.#onRootNodeInitializing = fn
  }

  set onRootNodeInitialized(
    fn: (rootNode: NOODLElement | null) => Promise<any>,
  ) {
    this.#onRootNodeInitialized = fn
  }

  set onBeforePageRender(
    fn: (options: {
      pageName: string
      rootNode: NOODLElement | null
    }) => Promise<NOODLUiPage | undefined>,
  ) {
    this.#onBeforePageRender = fn
  }

  set onPageRendered(
    fn: (options: {
      pageName: string
      components: NOODLComponentProps[]
    }) => Promise<any>,
  ) {
    this.#onPageRendered = fn
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
  public getDashboardPath() {
    return getPagePath(/meeting/)
  }

  /**
   * Takes a list of raw NOODL components and converts them into DOM nodes and appends
   * them to the DOM
   * @param { NOODLUIPage } page - Page in the shape of { name: string; object: null | NOODLPageObject }
   */
  public render(rawComponents: NOODLComponent[]) {
    let components

    if (_.isArray(rawComponents)) {
      components = noodl.resolveComponents(rawComponents)
    } else {
      components = noodl.resolveComponents()
    }

    let node

    if (this.rootNode) {
      // Clean up previous nodes
      // NOTE: textContent is used over innerHTML so that the contents can stay
      // plain text to reduce breaches into injection attacks
      this.rootNode.textContent = ''
      _.forEach(components, (component) => {
        node = parser.parse(component)
        if (node) {
          this.rootNode?.appendChild(node)
        }
      })
    } else {
      log.func('navigate')
      log.red(
        "Attempted to render the page's components but the root " +
          'node was not initialized. The page will not show anything',
        { rootNode: this.rootNode, nodes: this.nodes },
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
      nodes: this.nodes,
    }
  }

  public setBuiltIn(builtIn: any) {
    this.builtIn = builtIn
    return this
  }
}

export default Page
