import _ from 'lodash'
import {
  NOODLComponent,
  NOODLComponentProps,
  Page as NOODLUiPage,
} from 'noodl-ui'
import { openOutboundURL } from './utils/common'
import { cadl, noodl } from './app/client'
import { DOMNode, PageSnapshot } from './app/types'
import parser from './utils/parser'
import Modal from './components/NOODLModal'
import Logger from './app/Logger'
import { noodlDomParserEvents } from './constants'

const log = Logger.create('Page.ts')

export type PageListenerName =
  | 'onStart'
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
}

/**
 * This Page class is responsible for managing a NOODL page's state that is relative
 * to the page that is being presented to the user, like managing parsed components or
 * action chains that are running.
 */
class Page {
  private _initializeRootNode: () => void
  private _listeners: { [name: string]: Function } = {}
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
      (node: DOMNode, props: NOODLComponentProps) => {
        if (this.hasListener('onCreateNode')) {
          this._callListener('onCreateNode', node, props)
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

      await this._callListener('onStart', pageName)

      /** Handle the root node */
      if (!this.rootNode) {
        this._callListener('onRootNodeInitializing')
        this._initializeRootNode()
        if (this.rootNode) {
          this._callListener('onRootNodeInitialized', this.rootNode)
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
        pageSnapshot = await this._callListener('onBeforePageRender', {
          pageName,
          rootNode: this.rootNode,
        })

        const rendered = this.render(
          pageSnapshot?.object?.components as NOODLComponent[],
        )

        await this._callListener('onPageRendered', {
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
      if (this.hasListener('onError')) {
        await this._callListener('onError', { error, pageName })
      } else {
        throw new Error(error)
      }
    }
  }

  /**
   * Returns the link to the main dashboard page by using the noodl base url
   * @param { string } baseUrl - Base url retrieved from the noodl config
   */
  public getDashboardPath() {
    return this.getPagePath(/meeting/)
  }

  /** Handles onClick events for "goTo" handling.
   *    Ex: A NOODL page gives an onClick a value of "goToDashboard"
   *     The underlying function here will take a path string/regex and find a matching
   *     page path from the config, and will return the path if found.
   *     Otherwise it will return an empty string
   * @param { null | NOODLConfig } config
   * @return { string }
   */
  public getPagePath(pageName: string | RegExp) {
    const pages = cadl?.cadlEndpoint?.page || []
    const pagePath = _.find(pages, (name: string) =>
      _.isString(pageName)
        ? name.includes(pageName)
        : pageName instanceof RegExp
        ? pageName.test(name)
        : false,
    )
    return pagePath || ''
  }

  /** Navigates to a page using a portion of a page path uri
   * @param { string } pageName - Name of the page
   */
  // TODO: This func will will be deprecated in favor of this.navigate
  public async goToPage(pageName: string) {
    // Ensure the first letter is uppercased
    pageName = _.upperFirst(String(pageName))
    const pagePath = this.getPagePath(pageName)
    if (pagePath) {
      //
    } else {
      window.alert(`Could not find page ${pageName}`)
    }
  }

  public registerListener(
    listenerName: PageListenerName,
    listener: (...args: any[]) => any,
  ) {
    if (!_.isFunction(this._listeners[listenerName])) {
      this._listeners[listenerName] = listener
    } else {
      log.func('navigate')
      log.red(
        `An existing listener named ${listenerName} was already registered. ` +
          `It will be removed and replaced with this one`,
      )
    }
    return this
  }

  public hasListener(listenerName: string) {
    return _.isFunction(this._listeners[listenerName])
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

  private _callListener(listenerName: PageListenerName, ...args: any[]) {
    const result = this._listeners[listenerName]?.(...args)
    if (result && result instanceof Promise) {
      return Promise.resolve(result)
    }
    return result
  }
}

export default Page
