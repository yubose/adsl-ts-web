import invariant from 'invariant'
import { Identify, PageObject } from 'noodl-types'
import {
  Component,
  createComponent,
  findIteratorVar,
  isPage as isNUIPage,
  NUI,
  Page as NUIPage,
  NUIComponent,
  publish,
  Store,
  TransactionId as NUITransactionId,
} from 'noodl-ui'
import {
  createAsyncImageElement,
  getElementTag,
  openOutboundURL,
} from './utils'
import EventsCache from './cache/EventsCache'
import createResolver from './createResolver'
import NOODLDOMInternal from './Internal'
import MiddlewareUtils from './MiddlewareUtils'
import Page from './Page'
import * as defaultResolvers from './resolvers'
import * as c from './constants'
import * as u from './utils/internal'
import * as T from './types'
import { NUIComponent } from '../../noodl-ui/dist'

const pageEvt = c.eventId.page

interface Middleware {
  inst: MiddlewareUtils
  createGlobalComponentId:
    | MiddlewareUtils['createGlobalComponentId']
    | undefined
}

export interface GlobalStore {
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
  evts: EventsCache
}

class NOODLDOM extends NOODLDOMInternal {
  #middleware: Middleware = {
    inst: new MiddlewareUtils(),
    createGlobalComponentId: undefined,
  }
  #R: ReturnType<typeof createResolver>
  global: GlobalStore = {
    components: {},
    evts: new EventsCache(),
    pages: {},
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

  get actions() {
    return NOODLDOM._nui.cache.actions
  }

  get builtIns() {
    return NOODLDOM._nui.cache.actions.builtIn
  }

  get cache() {
    return { ...NOODLDOM._nui.cache, events: this.global.evts }
  }

  get length() {
    return Object.keys(this.global.pages).length
  }

  get pages() {
    return this.global.pages
  }

  get transactions() {
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

    page.on(c.eventId.page.on.ON_DOM_CLEANUP, ({ global, rootNode }) => {
      const clearAll = (n: HTMLElement | null) => {
        if (n) {
          let child = n.firstElementChild as HTMLElement
          while (child) {
            global.evts.clear(child)
            child = child.firstElementChild as HTMLElement
          }
          n.nextElementSibling && clearAll(n.nextElementSibling as HTMLElement)
        }
      }
      clearAll(rootNode)
    })

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
      const pageObject = await this.transact({
        transaction: c.transaction.REQUEST_PAGE_OBJECT,
        page,
      })
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
        pageObject && (page.components = (pageObject as PageObject)?.components)
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

    page.emitSync(c.eventId.page.on.ON_DOM_CLEANUP, {
      global: this.global,
      rootNode: page.rootNode,
    })

    page.clearRootNode()

    page.setStatus(c.eventId.page.status.RENDERING_COMPONENTS)

    components.forEach((component) => this.draw(component, page.rootNode, page))

    page.emitSync(c.eventId.page.on.ON_COMPONENTS_RENDERED, page)

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
    options?: { context?: Record<string, any>; node?: HTMLElement | null },
  ) {
    let node: T.NOODLDOMElement | null = options?.node || null
    let page: Page = pageProp || this.page

    if (component) {
      if (Identify.component.plugin(component)) {
        // We will delegate the role of the node creation to the consumer
        const getNode = (elem: HTMLElement) => (node = elem)
        this.#R.run(getNode, component)
        return node
      } else if (Identify.component.image(component)) {
        if (this.#R.get('createElement')?.cond?.(component)) {
          node = this.#R.get('createElement').resolve(component)
          node && (node['isElementBinding'] = true)
        } else {
          node = Identify.emit(component.get('path'))
            ? createAsyncImageElement(
                (container || document.body) as HTMLElement,
                {},
              )
            : document.createElement('img')
        }
      } else {
        if (this.#R.get('createElement')?.cond?.(component)) {
          node = this.#R.get('createElement').resolve(component)
          node && (node['isElementBinding'] = true)
        } else {
          node = document.createElement(getElementTag(component))
        }
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
        } else {
          console.log(`%cAvoided a duplicate global entry`, `color:#ec0000;`, {
            component,
            global: this.global,
          })
        }

        if (!u.isObj(this.global.components[globalId])) {
          this.global.components[globalId] = {
            componentId: component.id,
            globalId,
            pageId: page.id as string,
            node: node as HTMLElement,
          }
          const onClick = (e: Event) => {
            node?.removeEventListener('click', onClick)
            node?.remove()
            delete this.global.components[globalId]
          }
          node?.addEventListener('click', onClick)
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

        if (node?.dataset.globalid !== globalId) {
          node && (node.dataset.globalid = globalId)
        }
      }

      if (node) {
        const parent = component.has('global')
          ? document.body
          : container || document.body

        parent.appendChild(node)

        this.#R.run(node, component)

        component.children?.forEach?.((child: Component) => {
          const childNode = this.draw(child, node, page, options) as HTMLElement
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
    options?: Parameters<NOODLDOM['draw']>[3],
  ) {
    let context: any = options?.context
    let newNode: T.NOODLDOMElement | null = null
    let newComponent: Component | undefined
    let page =
      pageProp ||
      (Identify.component.page(component) && component.get('page')) ||
      this.page

    if (component) {
      if (Identify.component.listItem(component)) {
        const iteratorVar = findIteratorVar(component)
        if (iteratorVar) {
          context = { ...context }
          context.index = component.get('index') || 0
          context.dataObject = context?.dataObject || component.get(iteratorVar)
          context.iteratorVar = iteratorVar
        }
      }
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
        // Set the new component as a child on the pafrent
        parent.createChild(newComponent)
      }

      newComponent =
        NOODLDOM._nui.resolveComponents?.({
          components: newComponent,
          page,
          context,
        }) || newComponent
    }

    if (node) {
      const parentNode = node.parentNode
      if (newComponent) {
        newNode = this.draw(
          newComponent,
          parentNode || (document.body as any),
          page,
          { ...options, context },
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
      this.draw(newComponent as NUIComponent.Instance, null, page, {
        ...options,
        context,
      })
    }
    if (node instanceof HTMLElement) {
      // console.log(`%cRemoving node inside redraw`, `color:#00b406;`, node)
      try {
        node.parentNode?.removeChild?.(node)
        node.remove()
      } catch (error) {
        console.error(error)
      }
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
      NOODLDOM._nui.use({
        [obj.actionType]: obj,
      })
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
      | 'events'
      | 'resolvers'
      | 'transactions',
  ) {
    const resetActions = () => {
      NOODLDOM._nui.cache.actions.clear()
      NOODLDOM._nui.cache.actions.reset()
    }
    const resetComponentCache = () => {
      NOODLDOM._nui.cache.component.clear()
    }
    const resetEventCache = () => {
      this.global.evts.clear()
    }
    const resetPages = () => {
      this.page = undefined as any
      u.keys(this.pages).forEach((k) => delete this.pages[k])
      NOODLDOM._nui.cache.page.clear()
    }
    const resetResolvers = () => void (this.resolvers().length = 0)
    const resetGlobal = () => {
      resetEventCache()
      resetPages()
      u.keys(this.global.components).forEach(
        (k) => delete this.global.components[k],
      )
    }
    const resetTransactions = () => {
      NOODLDOM._nui.cache.transactions.clear()
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
      } else if (key === 'events') {
        resetEventCache()
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
    resetEventCache()
    resetGlobal()
    resetPages()
    resetResolvers()
    resetTransactions()

    return this
  }

  async transact(args: {
    transaction: typeof c.transaction.CREATE_ELEMENT
    component: NUIComponent.Instance
  }): Promise<HTMLElement | null>
  async transact(args: {
    transaction: typeof c.transaction.REQUEST_PAGE_OBJECT
    page: Page
  }): Promise<PageObject>
  async transact(args: {
    transaction: T.NDOMTransactionId
    component?: NUIComponent.Instance
    page?: Page
  }) {
    switch (args.transaction) {
      case c.transaction.CREATE_ELEMENT:
        return this.#R.get('createElement').resolve(args.component)
      case c.transaction.REQUEST_PAGE_OBJECT:
        return NOODLDOM._nui
          .getTransactions()
          .get(c.transaction.REQUEST_PAGE_OBJECT)
          ?.fn?.(args.page)
      default:
        return null
    }
  }

  use(nuiPage: NUIPage): Page
  use(opts: Partial<T.UseObject>): this
  use(obj: NUIPage | Partial<T.UseObject>) {
    if (isNUIPage(obj)) {
      return this.createPage(obj)
    } else {
      const { createGlobalComponentId, transaction, resolver, ...rest } = obj

      if (createGlobalComponentId) {
        this.#middleware.createGlobalComponentId = obj.createGlobalComponentId
      }

      if (resolver) {
        this.register(resolver)
      }

      if (transaction) {
        u.entries(transaction).forEach(([id, val]) => {
          if (id === c.transaction.REQUEST_PAGE_OBJECT) {
            const getPageObject = transaction[c.transaction.REQUEST_PAGE_OBJECT]
            NOODLDOM._nui.use({
              transaction: {
                [c.transaction.REQUEST_PAGE_OBJECT]: async (pageProp) => {
                  invariant(
                    u.isFnc(getPageObject),
                    `Missing transaction: ${c.transaction.REQUEST_PAGE_OBJECT}`,
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

                  pageObject = await getPageObject?.(page)
                  return pageObject as PageObject
                },
              },
            })
          } else {
            NOODLDOM._nui.use({ transaction: { [id]: val } })
          }
        })
      }

      NOODLDOM._nui.use(rest)
    }
    return this
  }
}

export default NOODLDOM
