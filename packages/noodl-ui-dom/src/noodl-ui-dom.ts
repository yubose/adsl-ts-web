import invariant from 'invariant'
import { Identify, PageObject } from 'noodl-types'
import * as u from '@jsmanifest/utils'
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
} from 'noodl-ui'
import { getFirstByGlobalId, getElementTag, openOutboundURL } from './utils'
import { GlobalComponentRecord } from './global'
import createAsyncImageElement from './utils/createAsyncImageElement'
import createResolver from './createResolver'
import NOODLDOMInternal from './Internal'
import Page from './Page'
import Timers from './global/Timers'
import * as defaultResolvers from './resolvers'
import * as c from './constants'
import * as T from './types'

const pageEvt = c.eventId.page

class NOODLDOM extends NOODLDOMInternal {
  #R: ReturnType<typeof createResolver>
  #createElementBinding = undefined as T.UseObject['createElementBinding']
  global: T.GlobalMap = {
    components: new Map(),
    pages: {},
    timers: new Timers(),
  }
  page: Page // This is the main (root) page. All other pages are stored in this.#pages

  static _nui: typeof NUI

  // TODO - Deperec
  constructor(nui?: typeof NUI) {
    super()
    this.#R = createResolver(this)
    this.#R.use(this)
    u.values(defaultResolvers).forEach(this.#R.use.bind(this.#R))
    if (nui) {
      NOODLDOM._nui = nui
      NOODLDOMInternal._nui = nui
    } else {
      NOODLDOM._nui = NOODLDOMInternal._nui
    }
  }

  get actions() {
    return this.cache.actions
  }

  get builtIns() {
    return this.actions.builtIn
  }

  get cache() {
    return NOODLDOM._nui.cache
  }

  get length() {
    return u.keys(this.global.pages).length
  }

  get pages() {
    return this.global.pages
  }

  get transactions() {
    return this.cache.transactions
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

  createGlobalRecord(
    args:
      | {
          type: 'component'
          component: NUIComponent.Instance
          id?: string
          node?: HTMLElement | null
          page: Page
        }
      | { type: 'page' },
  ) {
    switch (args.type) {
      case 'component':
        const { type, page, ...rest } = args
        const record = new GlobalComponentRecord({
          ...rest,
          page: page || this.page,
        })
        this.global.components.set(record.globalId, record)
        return record
      case 'page':
        break
      default:
        break
    }
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
    const remove = (c: NUIComponent.Instance) => {
      this.cache.component.remove(c)
      c.has?.('global') &&
        this.removeGlobal('component', c.get('data-globalid'))
      c.children?.forEach?.((_c) => {
        // c?.parent?.removeChild(c)
        c?.setParent?.(null)
        remove(_c)
      })
      c.clear?.()
    }
    remove(component)
    return this
  }

  removeGlobal(type: 'component', globalId: string | undefined) {
    if (globalId) {
      if (type === 'component') {
        if (this.global.components.has(globalId)) {
          const globalComponentObj = this.global.components.get(globalId)
          const obj = globalComponentObj?.toJSON()
          if (obj) {
            const { componentId, nodeId } = obj
            if (componentId) {
              if (this.cache.component.has(componentId)) {
                this.removeComponent(this.cache.component.get(componentId))
              }
            }
            this.global.components.delete(globalId)
            if (nodeId) {
              const node = getFirstByGlobalId(globalId)
              if (node) {
                console.log(
                  `%c[removeGlobal] Removing global DOM node with globalId "${globalId}"`,
                  `color:#95a5a6;`,
                )
                this.removeNode(node)
              }
            }
          }
        }
      }
    }
  }

  removeNode(node: T.NOODLDOMElement) {
    if (node?.id) {
      try {
        node.parentElement?.removeChild?.(node)
        node.remove?.()
      } catch (error) {
        console.error(error)
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

    // u.keys(page.modifiers).forEach(
    //   (key) => key !== pageRequesting && delete page.modifiers[key],
    // )

    try {
      page.ref.request.timer && clearTimeout(page.ref.request.timer)

      const pageObject = await this.transact({
        transaction: c.transaction.REQUEST_PAGE_OBJECT,
        page,
      })

      u.keys(page.modifiers).forEach((key) => delete page.modifiers[key])
      /**
       * TODO - Move this to an official location when we have time
       */

      const action = async (cb: () => any | Promise<any>) => {
        try {
          if (
            (!pageRequesting && page.requesting) ||
            pageRequesting === page.requesting
          ) {
            await cb()
          } else if (page.requesting) {
            console.log(
              `%cAborting this navigate request to ${pageRequesting} because a more ` +
                `recent request for "${page.requesting}" was instantiated`,
              `color:#FF5722;`,
              { pageAborting: pageRequesting, pageRequesting: page.requesting },
            )
            await page.emitAsync(pageEvt.on.ON_NAVIGATE_ABORT, page.snapshot())
            // Remove the page modifiers so they don't propagate to subsequent navigates
            delete page.state.modifiers[pageRequesting]
            return console.error(
              `A more recent request from "${pageRequesting}" to "${page.requesting}" was called`,
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
        page.emitSync(pageEvt.on.ON_NAVIGATE_START, page)
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
   * Parses props and returns a DOM node described by props. This also
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
        // @ts-expect-error
        this.#R.run(getNode, component)
        return node
      } else if (Identify.component.image(component)) {
        if (this.#createElementBinding) {
          node = this.#createElementBinding(component) as HTMLElement
        }
        if (!node) {
          node = Identify.folds.emit(component.get('path'))
            ? createAsyncImageElement(
                (container || document.body) as HTMLElement,
                {},
              )
            : document.createElement('img')
        }
      } else {
        node = this.#createElementBinding?.(component) || null
        node
          ? (node['isElementBinding'] = true)
          : (node = document.createElement(getElementTag(component)))
      }

      const attachOnClick = (n: HTMLElement | null, globalId: string) => {
        if (n) {
          const onClick = () => {
            n.removeEventListener('click', onClick)
            this.removeNode(n)
            this.removeGlobal('component', globalId)
          }
          n.addEventListener('click', onClick)
        }
      }

      if (component.has?.('global')) {
        let globalRecord: GlobalComponentRecord
        let globalId = component.get('data-globalid')

        if (this.global.components.has(globalId)) {
          globalRecord = this.global.components.get(
            globalId,
          ) as GlobalComponentRecord
        } else {
          globalRecord = this.createGlobalRecord({
            type: 'component',
            id: globalId,
            component,
            node,
            page,
          }) as GlobalComponentRecord
          this.global.components.set(globalId, globalRecord)
          attachOnClick(node, globalId)
        }

        if (globalRecord) {
          component.edit({ 'data-globalid': globalId, globalId })
          // Check mismatchings and recover from them

          const publishMismatchMsg = (
            type: 'node' | 'component',
            extendedText?: string,
          ) => {
            const id =
              type === 'node'
                ? node?.id ||
                  `<Missing node id (component id is "${component.id}")>`
                : type === 'component'
                ? component.id
                : '<Missing ID>'
            console.log(
              `%cThe ${type} with id "${id}" is different than the one in the global object.${
                extendedText || ''
              }`,
              `color:#CCCD17`,
              { globalObject: globalRecord },
            )
          }

          if (globalRecord.componentId !== component.id) {
            publishMismatchMsg('component')
            this.removeComponent(
              this.cache.component.get(globalRecord.componentId),
            )
            globalRecord.componentId = component.id
          }

          if (node) {
            if (!node.id) node.id = component.id
            if (globalRecord.nodeId) {
              if (globalRecord.nodeId !== node.id) {
                publishMismatchMsg(
                  'node',
                  `The old node will be ` +
                    `replaced with the incoming node's id`,
                )
                const _prevNode = document.getElementById(globalRecord.nodeId)
                if (_prevNode) {
                  console.log(
                    `%cRemoving previous node using id "${globalRecord.nodeId}"`,
                    `color:#95a5a6;`,
                  )
                  this.removeNode(_prevNode)
                } else {
                  console.log(
                    `%cDid not remove previous node with id "${globalRecord.nodeId}" ` +
                      `because it did not exist`,
                    `color:#95a5a6;`,
                  )
                }
                globalRecord.nodeId = node.id
                node.dataset.globalid = globalId
                console.log(
                  `%cReplaced nodeId "${globalRecord.nodeId}" with "${node.id} on the global ` +
                    `component record`,
                  globalRecord,
                )
              }
            } else {
              globalRecord.nodeId = node.id
              node.dataset.globalid = globalId
            }
          }

          if (globalRecord.pageId !== page.id) {
            console.log(
              `%cPage ID for global object with id "${component.get(
                'data-globalid',
              )}" does not match with the page that is drawing for component "${
                component.id
              }"`,
              `color:#FF5722;`,
              globalRecord,
            )
          }
        }
      }

      if (node) {
        const parent = component.has?.('global')
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

    if (!page) {
      throw new Error(
        `The "page" is not a valid noodl-ui-dom page. Check the ` +
          `redraw function`,
      )
    }

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
            } else {
              console.log(
                `%cCould not find a NUIPage in redraw`,
                `color:#ec0000;`,
              )
            }
          }
        }
      })

      newComponent = createComponent(component.blueprint)

      if (parent && newComponent) {
        // Set the original parent on the new component
        newComponent.setParent(parent)
        // Set the new component as a child on the parent
        parent.createChild(newComponent)
      }

      this.removeComponent(component)

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
      NOODLDOM._nui.use({ [obj.actionType]: obj })
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
    register?: boolean
    resolvers?: boolean
    transactions?: boolean
  }): this
  reset(
    key?:
      | 'actions'
      | 'componentCache'
      | 'register'
      | 'resolvers'
      | 'transactions',
  ): this
  reset(
    key?:
      | {
          actions?: boolean
          componentCache?: boolean
          global?: boolean
          pages?: boolean
          register?: boolean
          resolvers?: boolean
          transactions?: boolean
        }
      | 'actions'
      | 'componentCache'
      | 'register'
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
    const resetPages = () => {
      this.page = undefined as any
      u.eachEntries(this.pages, (pageName, page: Page) => {
        delete this.pages[pageName]
        page?.reset?.()
      })
      NOODLDOM._nui.cache.page.clear()
    }
    const resetRegisters = () => NOODLDOM._nui.cache.register.clear()
    const resetResolvers = () => void (this.resolvers().length = 0)
    const resetGlobal = () => {
      resetPages()
      u.keys(this.global).forEach((k) => {
        if (k === 'component') {
          const record = this.global.components.get(k)
          if (record) {
            if (record.nodeId) {
              document.getElementById(record.nodeId)?.remove?.()
            }
            if (this.cache.component.has(record.componentId)) {
              this.removeComponent(this.cache.component.get(record.componentId))
            }
          }
          this.global.components.delete(record?.globalId as string)
        } else if (k === 'page') {
        }
      })
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
      } else if (key === 'resolvers') {
        resetResolvers()
      } else if (key === 'register') {
        resetRegisters()
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
    resetRegisters()
    resetResolvers()
    resetTransactions()
    return this
  }

  async transact(args: {
    transaction: typeof c.transaction.REQUEST_PAGE_OBJECT
    page: Page
  }): Promise<PageObject>
  async transact(args: {
    transaction: T.NDOMTransaction.Id
    component?: NUIComponent.Instance
    page?: Page
  }) {
    switch (args.transaction) {
      case c.transaction.REQUEST_PAGE_OBJECT:
        return (
          this.cache.transactions
            .get(c.transaction.REQUEST_PAGE_OBJECT)
            // @ts-expect-error
            ?.fn?.(args.page)
        )
      default:
        return null
    }
  }

  use(obj: NUIPage | Partial<T.UseObject>) {
    if (!obj) return
    if (isNUIPage(obj)) return this.createPage(obj)

    const { createElementBinding, register, transaction, resolver, ...rest } =
      obj

    createElementBinding && (this.#createElementBinding = createElementBinding)
    resolver && this.register(resolver)

    if (transaction) {
      u.eachEntries(transaction, (id, val) => {
        if (id === c.transaction.REQUEST_PAGE_OBJECT) {
          const getPageObject = transaction[c.transaction.REQUEST_PAGE_OBJECT]
          NOODLDOM._nui.use({
            transaction: {
              [c.transaction.REQUEST_PAGE_OBJECT]: async (
                pageProp: NUIPage,
              ) => {
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
    return this
  }
}

export default NOODLDOM
