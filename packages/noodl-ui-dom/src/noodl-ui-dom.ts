import invariant from 'invariant'
import { isActionChain } from 'noodl-action-chain'
import { Identify, PageObject, userEvent } from 'noodl-types'
import {
  Component,
  createComponent,
  isPage as isNUIPage,
  NOODLUI as NUI,
  Page as NUIPage,
  NUIComponent,
  nuiEmitTransaction,
  publish,
  Store,
  Transaction as NUITransaction,
  TransactionId,
} from 'noodl-ui'
import {
  createAsyncImageElement,
  getElementTag,
  openOutboundURL,
} from './utils'
import createResolver from './createResolver'
import NOODLDOMInternal from './Internal'
import MiddlewareUtils from './MiddlewareUtils'
import Page from './Page'
import * as defaultResolvers from './resolvers'
import * as c from './constants'
import * as u from './utils/internal'
import * as T from './types'

const pageEvt = c.eventId.page

interface Middleware {
  inst: MiddlewareUtils
  createGlobalComponentId:
    | MiddlewareUtils['createGlobalComponentId']
    | undefined
}

interface GlobalStore {
  pages: Record<string, Page>
  components: Record<
    string,
    {
      globalId: string
      pageId: string
      componentId: string
      node: HTMLElement
    }
  >
}

class NOODLDOM extends NOODLDOMInternal {
  #middleware: Middleware = {
    inst: new MiddlewareUtils(),
    createGlobalComponentId: undefined,
  }
  #R: ReturnType<typeof createResolver>
  global: GlobalStore = {
    pages: {},
    components: {},
  }
  page: Page // This is the main (root) page. All other pages are stored in this.#pages

  static _nui: typeof NUI

  constructor(nui?: typeof NUI) {
    super()
    this.#R = createResolver(this)
    this.#R.use(this)
    u.values(defaultResolvers).forEach(this.#R.use.bind(this.#R))
    NOODLDOM._nui = nui || NUI
  }

  get actions(): ReturnType<typeof NOODLDOM._nui.getActions> {
    return NOODLDOM._nui.getActions()
  }

  get builtIns(): ReturnType<typeof NOODLDOM._nui.getBuiltIns> {
    return NOODLDOM._nui.getBuiltIns()
  }

  get cache(): typeof NOODLDOM._nui.cache {
    return NOODLDOM._nui.cache
  }

  get length() {
    return Object.keys(this.global.pages).length
  }

  get pages() {
    return this.global.pages
  }

  get transactions(): NUITransaction {
    return NOODLDOM._nui.getTransactions()
  }

  createPage(nuiPage?: NUIPage): Page
  createPage(args: Parameters<typeof NUI['createPage']>[0]): Page
  createPage(args: {
    page: NUIPage
    viewport?: { width?: number; height?: number }
  }): Page
  createPage(args: string): Page
  createPage(
    args?:
      | NUIPage
      | Parameters<typeof NUI['createPage']>[0]
      | { page: NUIPage; viewport?: { width?: number; height?: number } }
      | string,
  ) {
    let page: Page | undefined

    const getExistingPage = (nuiPage: NUIPage) => {
      if (this.page?.isEqual?.(nuiPage)) return this.page
      return Object.values(this.pages).find((page) => page.isEqual(nuiPage))
    }

    if (isNUIPage(args)) {
      page = getExistingPage(args)
      if (!page) page = new Page(args)
    } else if (u.isObj(args)) {
      if ('page' in args) {
        page = getExistingPage(args.page)
        if (!page) {
          page = new Page(args.page)
          if (args.viewport) u.assign(page.viewport, args.viewport)
        }
      } else {
        page = new Page(NOODLDOM._nui.createPage?.(args))
      }
    } else if (u.isStr(args)) {
      page = new Page(NOODLDOM._nui.createPage?.({ name: args }))
    } else {
      page = new Page(NOODLDOM._nui.createPage?.())
    }

    this.global.pages[page.id] !== page && (this.global.pages[page.id] = page)
    !this.page && (this.page = page)
    return page as Page
  }

  /** TODO - More cases */
  findPage(nuiPage: NUIPage) {
    if (isNUIPage(nuiPage)) {
      return Object.values(this.global.pages).find((page) =>
        page.isEqual(nuiPage),
      )
    }
    return null
  }

  removePage(page: Page | undefined | null) {
    if (page) {
      page.remove()
      if (page.id in this.global.pages) delete this.global.pages[page.id]
      page = null
    }
  }

  removeComponent(component: NUIComponent.Instance | undefined | null) {
    if (!component) return this
    component.parent?.removeChild?.(component)
    component.setParent(null)
    publish(component, (c) => {
      c.parent?.removeChild?.(c)
      c.setParent(null)
      // Removes from cache store
      this.cache.component.remove(c)
    })
    this.cache.component.remove(component)
    return this
  }

  removeNode(node: T.NOODLDOMElement) {
    if (node instanceof HTMLElement && node.id) {
      // Remove from global store
      if (
        node.dataset.globalid &&
        this.global.components[node.dataset.globalid]
      ) {
        let globalObj = this.global.components[node.dataset.globalid]
        let componentId = globalObj.componentId
        // Remove from DOM
        globalObj.node && globalObj.node !== node && globalObj.node.remove()
        // Remove parent/child references
        componentId &&
          this.cache.component.has(componentId) &&
          this.removeComponent(this.cache.component.get(globalObj.componentId))
        // Remove global object
        delete this.global.components[globalObj.globalId]
      }
      // Remove from component cache
      if (this.cache.component.has(node?.id)) {
        this.removeComponent(this.cache.component.get(node?.id))
      }
      // Remove parent references
      node?.parentNode?.removeChild?.(node)
      // Remove from DOM
      node?.remove?.()
    }

    return this
  }

  /**
   * Initiates a request to the parameters set in Page.
   * The page.requesting value should be set prior to calling this method unless
   * pageRequesting is provided. If it is provided, it will be set automatically
   * @param { NOODLDOMPage } page
   */
  async request(page = this.page, pageRequesting = '') {
    // Cache the currently requesting page to detect for newer requests during the call
    pageRequesting = pageRequesting || page.requesting

    u.keys(page.modifiers).forEach(
      (key) => key !== pageRequesting && delete page.modifiers[key],
    )

    try {
      page.ref.request.timer && clearTimeout(page.ref.request.timer)

      const pageObject = await this.transact(
        nuiEmitTransaction.REQUEST_PAGE_OBJECT,
        page,
      )

      const action = async (cb: () => any | Promise<any>) => {
        try {
          if (pageRequesting === page.requesting) {
            await cb()
          } else if (page.requesting) {
            console.log(
              `%cAborting this navigate request to ${pageRequesting} because a more ` +
                `recent request for "${page.requesting}" was instantiated`,
              `color:#FF5722;`,
              {
                pageAborting: pageRequesting,
                pageRequesting: page.requesting,
              },
            )
            await page.emitAsync(pageEvt.on.ON_NAVIGATE_ABORT, page.snapshot())
            // Remove the page modifiers so they don't propagate to subsequent navigates
            delete page.state.modifiers[pageRequesting]
            return console.error(
              `A more recent request to ${page.requesting} was called`,
            )
          }
        } catch (error) {
          throw error
        }
      }

      await action(() => {
        pageObject && (page.components = pageObject?.components)
      })

      page.setStatus(pageEvt.status.NAVIGATING)

      // Outside link
      if (pageRequesting.startsWith('http')) {
        await page.emitAsync(pageEvt.on.ON_OUTBOUND_REDIRECT, page.snapshot())
        await action(() => void (page.requesting = ''))
        return openOutboundURL(pageRequesting)
      }

      await action(() => {
        page.emitAsync(pageEvt.on.ON_NAVIGATE_START, page.snapshot())
        if (process.env.NODE_ENV !== 'test') {
          history.pushState({}, '', page.pageUrl)
        }
      })

      await action(async () => {
        if (
          (await page.emitAsync(
            pageEvt.on.ON_BEFORE_RENDER_COMPONENTS,
            page.snapshot(),
          )) === 'old.request'
        ) {
          await page.emitAsync(pageEvt.on.ON_NAVIGATE_ABORT, page.snapshot())
          throw new Error(`A more recent request was called`)
        }
      })

      await action(() => {
        page.previous = page.page
        page.page = page.requesting
        page.requesting = ''
      })
    } catch (error) {
      if (pageRequesting === page.requesting) {
        page.requesting = ''
      }
      throw error
    }

    return {
      render: () => this.render(page),
    }
  }

  /**
   * Takes a list of raw NOODL components, converts to DOM nodes and appends to the DOM
   * @param { ComponentObject | ComponentObject[] } components
   */
  render(page: Page) {
    page.reset('render')
    // Create the root node where we will be placing DOM nodes inside.
    // The root node is a direct child of document.body
    page.setStatus(c.eventId.page.status.RESOLVING_COMPONENTS)

    this.reset('componentCache')

    const components = u.array(
      NOODLDOM._nui.resolveComponents.call(NOODLDOM._nui, {
        components: page.components,
        page: page.getNuiPage(),
      }),
    ) as NUIComponent.Instance[]

    page.setStatus(c.eventId.page.status.COMPONENTS_RECEIVED)

    page.emitSync(c.eventId.page.on.ON_DOM_CLEANUP, page.rootNode)

    page.clearRootNode()

    page.setStatus(c.eventId.page.status.RENDERING_COMPONENTS)

    components.forEach((component) => this.draw(component, page.rootNode, page))

    page.setStatus(c.eventId.page.status.COMPONENTS_RENDERED)

    return components as NUIComponent.Instance[]
  }

  /**
   * Parses props and returns a DOM Node described by props. This also
   * resolves its children hieararchy until there are none left
   * @param { Component } props
   */
  draw<C extends Component = any>(
    component: C,
    container?: T.NOODLDOMElement | null,
    pageProp?: Page,
  ) {
    let node: T.NOODLDOMElement | null = null
    let page: Page = pageProp || this.page

    if (component) {
      for (const evt of userEvent) {
        if (component.has(evt)) {
          const ac = component.get(evt)
          if (isActionChain(ac)) {
            const numActions = ac.actions.length
            for (let index = 0; index < numActions; index++) {
              const obj = ac.actions[index]
              if (Identify.action.builtIn(obj)) {
                if (obj.funcName === 'show') {
                  const viewTag = obj.viewTag
                  // if (node.style.position)
                  console.log(`A node has a "show" action`)
                  if (!page.state.viewTag) {
                    // page.state.viewTag = {}}
                    // page.state.viewTag[obj.viewTag] = [component.id]
                    break
                  }
                }
              }
            }
          }
        }
      }

      if (Identify.component.plugin(component)) {
        // We will delegate the role of the node creation to the consumer
        const getNode = (elem: HTMLElement) => (node = elem)
        this.#R.run(getNode, component)
        return node
      } else if (Identify.component.image(component)) {
        node = Identify.emit(component.blueprint?.path)
          ? createAsyncImageElement(
              (container || document.body) as HTMLElement,
              {},
            )
          : document.createElement('img')
      } else {
        node = document.createElement(getElementTag(component))
      }

      if (component.has('global')) {
        let globalId = component.get('globalId') as string

        if (!globalId || !(globalId in this.global.components)) {
          globalId = (
            this.#middleware.createGlobalComponentId ||
            this.#middleware.inst.createGlobalComponentId
          )?.(page, component)

          // TODO - remove "globalId" key in favor of data-globalid
          component.edit({ 'data-globalid': globalId, globalId })
        }

        if (!u.isObj(this.global.components[globalId])) {
          this.global.components[globalId] = {
            componentId: component.id,
            globalId,
            pageId: page.id as string,
            node,
          }
        }

        // Check if there are any missing information in its global object
        let globalObj = this.global.components[globalId]

        if (globalObj.componentId !== component.id) {
          globalObj.componentId = component.id
        }

        if (globalObj.globalId !== globalId) {
          globalObj.globalId = globalId
        }

        if (globalObj.pageId !== page.id) {
          globalObj.pageId = page.id as string
        }

        if (node) {
          // Don't replace the node but just copy the attributes/styles to it. This
          // is to prevent disruptions in media streams like webcams
          if (globalObj.node) {
            if (globalObj.node !== node) {
              // TODO - Copy existing styles/attributes to the existing node
              // Remove parent/child references if any
              node.parentNode?.removeChild?.(node)
              node.remove?.()
              node = globalObj.node
            }
          } else {
            globalObj.node = node
          }
        }

        if (node.dataset.globalid !== globalId) {
          node.dataset.globalid = globalId
        }
      }

      if (node) {
        const parent = component.has('global')
          ? document.body
          : container || document.body

        parent.appendChild(node)

        this.#R.run(node, component)

        component.children?.forEach?.((child: Component) => {
          const childNode = this.draw(child, node, page) as HTMLElement
          node?.appendChild(childNode)
        })
      }
    }
    return node || null
  }

  redraw(
    node: T.NOODLDOMElement | null, // ex: li (dom node)
    component: Component, // ex: listItem (component instance)
    pageProp?: Page,
  ) {
    let newNode: T.NOODLDOMElement | null = null
    let newComponent: Component | undefined
    let page =
      pageProp ||
      (Identify.component.page(component) && component.get('page')) ||
      this.page

    if (component) {
      const parent = component.parent
      // Clean up state from the component
      component.clear('hooks')
      // Remove the parent reference
      component.setParent?.(null)

      page.emitSync(c.eventId.page.on.ON_REDRAW_BEFORE_CLEANUP, node, component)

      // Deeply walk down the tree hierarchy
      publish(component, (c) => {
        if (c) {
          if (Identify.component.page(c)) {
            const page = this.findPage(c.get('page'))
            if (page) {
              console.log(
                `%cRedrawing a page component`,
                `color:#00b406;`,
                page,
              )
              this.removePage(page)

              // page.rootNode = null as any
            } else {
              console.log(
                `%cCould not find a NUIPage in redraw`,
                `color:#ec0000;`,
              )
            }
          }
          const cParent = c.parent
          // Remove listeners
          c.clear('hooks')
          // Remove child component references
          cParent?.removeChild?.(c)
          // Remove the child's parent reference
          c.setParent?.(null)
          // this.cache.component.remove(c)
        }
      })

      // Create the new component
      newComponent = createComponent(component.blueprint)
      if (parent && newComponent) {
        // Set the original parent on the new component
        newComponent.setParent(parent)
        // Remove the child reference from the parent
        parent?.removeChild?.(component)
        // Set the new component as a child on the parent
        parent.createChild(newComponent)
      }

      newComponent =
        NOODLDOM._nui.resolveComponents?.({
          components: newComponent,
          page,
        }) || newComponent
    }

    if (node) {
      const parentNode = node.parentNode
      if (newComponent) {
        newNode = this.draw(
          newComponent,
          parentNode || (document.body as any),
          page,
        )
      }
      if (parentNode) {
        if (parentNode.contains(node) && newNode) {
          parentNode.replaceChild(newNode, node)
        } else if (newNode) {
          parentNode.insertBefore(newNode, parentNode.childNodes[0])
        }
      }
    } else if (component) {
      // Some components like "plugin" can have a null as their node, but their
      // component is still running
      this.draw(newComponent as NUIComponent.Instance, null, page)
    }
    if (node instanceof HTMLElement) {
      console.log(`%cRemoving node inside redraw`, `color:#00b406;`, node)
      node.remove()
    }
    return [newNode, newComponent] as [typeof node, typeof component]
  }

  register(obj: Store.ActionObject): this
  register(obj: Store.BuiltInObject): this
  register(obj: T.Resolve.Config): this
  register(
    obj: T.Resolve.Config | Store.ActionObject | Store.BuiltInObject,
  ): this {
    if ('resolve' in obj) {
      this.#R.use(obj)
    } else if ('actionType' in obj || 'funcName' in obj) {
      NOODLDOM._nui.use(obj)
    }
    return this
  }

  resolvers() {
    return this.#R.get()
  }

  reset(opts?: {
    componentCache?: boolean
    global?: boolean
    pages?: boolean
    resolvers?: boolean
    transactions?: boolean
  }): this
  reset(key?: 'actions' | 'componentCache' | 'resolvers' | 'transactions'): this
  reset(
    key?:
      | {
          actions?: boolean
          componentCache?: boolean
          global?: boolean
          pages?: boolean
          resolvers?: boolean
          transactions?: boolean
        }
      | 'actions'
      | 'componentCache'
      | 'resolvers'
      | 'transactions',
  ) {
    const resetActions = () => {
      u.values(NOODLDOM._nui.getActions()).forEach((arr) => (arr.length = 0))
      u.values(NOODLDOM._nui.getBuiltIns()).forEach((arr) => (arr.length = 0))
    }
    const resetComponentCache = () => {
      NOODLDOM._nui.cache.component.clear()
    }
    const resetPages = () => {
      this.page = undefined as any
      u.keys(this.pages).forEach((k) => delete this.pages[k])
      NOODLDOM._nui.cache.page.clear()
    }
    const resetResolvers = () => void (this.resolvers().length = 0)
    const resetGlobal = () => {
      resetPages()
      u.keys(this.global.components).forEach(
        (k) => delete this.global.components[k],
      )
    }
    const resetTransactions = () => {
      u.keys(this.transactions).forEach((k) => delete this.transactions[k])
    }

    if (key !== undefined) {
      if (u.isObj(key)) {
        key.componentCache && resetComponentCache()
        key.global && resetGlobal()
        key.pages && resetPages()
        key.resolvers && resetResolvers()
        key.transactions && resetTransactions()
      } else if (key === 'actions') {
        resetActions()
      } else if (key === 'componentCache') {
        resetComponentCache()
      } else if (key === 'resolvers') {
        resetResolvers()
      } else if (key === 'transactions') {
        resetTransactions()
      }
      return this
    }
    // The operations below is equivalent to a "full reset"
    resetActions()
    resetComponentCache()
    resetGlobal()
    resetPages()
    resetResolvers()
    resetTransactions()

    return this
  }

  async transact<TType extends TransactionId>(
    transaction: TType,
    args: Parameters<T.Transaction[TType]>[0],
  ) {
    return this.transactions[transaction]?.fn?.(args)
  }

  use(nuiPage: NUIPage): Page
  use(opts: Partial<T.UseObject>): this
  use(obj: NUIPage | Partial<T.UseObject>) {
    if (isNUIPage(obj)) {
      return this.createPage(obj)
    } else if (
      'actionType' in obj ||
      'funcName' in obj ||
      'location' in obj ||
      'resolve' in obj
    ) {
      NOODLDOM._nui.use(obj)
    } else if (u.isObj(obj)) {
      u.entries(obj).forEach(([key, o]) => {
        if (key === 'createGlobalComponentId') {
          this.#middleware.createGlobalComponentId = o
        } else if (key === 'resolver') {
          this.register(o)
        } else if (key === 'transaction') {
          if (o[nuiEmitTransaction.REQUEST_PAGE_OBJECT]) {
            NOODLDOM._nui.use({
              transaction: {
                [nuiEmitTransaction.REQUEST_PAGE_OBJECT]: async (pageProp) => {
                  let originalFn = o[nuiEmitTransaction.REQUEST_PAGE_OBJECT]

                  invariant(
                    u.isFnc(originalFn),
                    `Missing transaction: ${nuiEmitTransaction.REQUEST_PAGE_OBJECT}`,
                  )

                  let nuiPage: NUIPage

                  if (u.isStr(pageProp)) {
                    // Default to main page
                    nuiPage = this.page.getNuiPage()
                  } else {
                    // Most likely coming from a page component's "nuiPage" property
                    nuiPage = pageProp
                  }

                  let pageObject: PageObject | undefined
                  let page =
                    u.values(this.pages).find((pg) => pg.isEqual(nuiPage)) ||
                    this.createPage(nuiPage)

                  if (!page.requesting) {
                    // Default to use the one set on the NUIPage
                    // This is to be compatible with page components being generated on the fly
                    page.requesting = nuiPage.page
                  }

                  pageObject = await originalFn?.(page)
                  return pageObject as PageObject
                },
              },
            })
          } else {
            NOODLDOM._nui.use({ transaction: o })
          }
        } else {
          NOODLDOM._nui.use({ [key]: o })
        }
      })
    }
    return this
  }
}

export default NOODLDOM
