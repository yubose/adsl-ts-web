import invariant from 'invariant'
import { Identify, PageObject } from 'noodl-types'
import * as u from '@jsmanifest/utils'
import {
  init,
  classModule,
  propsModule,
  styleModule,
  eventListenersModule,
  h,
  toVNode,
} from 'snabbdom'
import diff from 'virtual-dom/diff'
import createElement from 'virtual-dom/create-element'
import patch from 'virtual-dom/patch'
import VNode from 'virtual-dom/vnode/vnode'
import VText from 'virtual-dom/vnode/vtext'
import type {
  ConsumerOptions,
  NUIComponent,
  Page as NUIPage,
  Store,
} from 'noodl-ui'
import {
  createComponent,
  findIteratorVar,
  isComponent,
  NUI,
  nuiEmitTransaction,
} from 'noodl-ui'
import type { ComponentPage } from './factory/componentFactory'
import { getElementTag, openOutboundURL } from './utils'
import GlobalComponentRecord from './global/GlobalComponentRecord'
import createAsyncImageElement from './utils/createAsyncImageElement'
import componentFactory from './factory/componentFactory/componentFactory'
import globalFactory from './factory/globalFactory'
import isComponentPage from './utils/isComponentPage'
import isNDOMPage from './utils/isPage'
import NDOMInternal from './Internal'
import NDOMGlobal from './Global'
import NDOMPage from './Page'
import { cache as nuiCache, nui } from './nui'
import attributeResolvers from './resolvers/attributes'
import componentResolvers from './resolvers/components'
import Resolver from './Resolver'
import * as i from './utils/internal'
import * as c from './constants'
import * as t from './types'

const pageEvt = c.eventId.page
const defaultResolvers = [attributeResolvers, componentResolvers]

class NDOM extends NDOMInternal {
  #R: Resolver
  #createElementBinding = undefined as t.UseObject['createElementBinding']
  #hooks = {
    onRedrawStart: [],
    onBeforeRequestPageObject: [],
    onAfterRequestPageObject: [],
  } as Record<keyof t.Hooks, t.Hooks[keyof t.Hooks][]>
  consumerResolvers = [] as t.Resolve.Config[]
  global = new NDOMGlobal()
  page: NDOMPage; // This is the main (root) page. All other pages are stored in this.global.pages

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      consumerResolvers: this.consumerResolvers,
      global: {
        components: this.global.components,
        pages: this.global.pages,
        pageIds: this.global.pageIds,
        pageNames: this.global.pageNames,
        timers: this.global.timers,
      },
      hooks: this.hooks,
      resolvers: this.resolvers,
    }
  }

  constructor() {
    super()
    this.#R = new Resolver()
    i._syncPages.call(this)
  }

  get actions() {
    return nuiCache.actions
  }

  get builtIns() {
    return this.actions.builtIn
  }

  get cache() {
    return nuiCache
  }

  get hooks() {
    return this.#hooks
  }

  get length() {
    return u.keys(this.global.pages).length
  }

  get pages() {
    return this.global.pages
  }

  get resolvers() {
    return [...defaultResolvers, ...this.consumerResolvers]
  }

  get transactions() {
    return nuiCache.transactions
  }

  createPage(component: NUIComponent.Instance): ComponentPage
  createPage(nuiPage: NUIPage): NDOMPage | ComponentPage
  createPage(
    args: Parameters<typeof NUI['createPage']>[0],
  ): NDOMPage | ComponentPage
  createPage(args: {
    page: NUIPage
    viewport?: { width?: number; height?: number }
  }): ComponentPage | NDOMPage
  createPage(name: string): NDOMPage
  createPage(
    args?:
      | NUIComponent.Instance
      | NUIPage
      | Parameters<typeof NUI['createPage']>[0]
      | { page: NUIPage; viewport?: { width?: number; height?: number } }
      | string,
  ) {
    let page: NDOMPage | ComponentPage | undefined

    const createComponentPage = (arg: NUIPage | NUIComponent.Instance) => {
      if (arg?.id === 'root') {
        if (!i._isNUIPage(arg)) {
          console.log(
            `%cA root NDOMPage is being instantiated but the argument given was not a NUIPage`,
            `color:#ec0000;`,
            arg,
          )
        }
        return new NDOMPage(arg as NUIPage)
      }

      return componentFactory.createComponentPage(
        arg as NUIComponent.Instance,
        {
          onLoad: (evt, node) => {
            console.log(
              `%c[onLoad] NUIPage loaded for page "${page?.page}" on a page component`,
              `color:#00b406;`,
              { event: evt, node },
            )
          },
          onError: (err) => {
            console.log(
              `%c[onError] Error creating an NDOM page for a page component: ${err.message}`,
              `color:#ec0000;`,
              err,
            )
          },
        },
      )
    }

    if (i._isNUIPage(args)) {
      return this.findPage(args) || createComponentPage(args)
    } else if (isComponent(args)) {
      return this.findPage(args) || createComponentPage(args)
    } else if (u.isObj(args)) {
      if ('page' in args) {
        return this.createPage(args.page)
      } else if ('component' in args) {
        return this.createPage(args.component)
      } else {
        args.id && (page = this.findPage(args.id))
        if (!page) return createComponentPage(nui.createPage(args) as NUIPage)
      }
    } else if (u.isStr(args) || u.isNum(args)) {
      if (args === '') {
        page = this.findPage('')
        // Dispose the old one for the new one since we only support 1 loading
        // page at a time
        if (page) {
          if (page.id === 'root') {
            if (!this.page) this.page = page
          } else {
            this.removePage(page)
            return this.createPage('')
          }
        } else {
          page = createComponentPage(
            nui.createPage({
              id: this.global.pageIds.includes('root') ? args : 'root',
              name: '',
            }) as NUIPage,
          )
          // NOTE/TODO - Fix this so that it reuses the existing main page
          if (page.id === 'root' && this.page !== page) this.page = page
          return page
        }
      } else {
        return (
          this.findPage(args) ||
          createComponentPage(nui.createPage({ name: args }) as NUIPage)
        )
      }
    } else {
      return createComponentPage(nui.createPage({ name: args }) as NUIPage)
    }

    return page
  }

  createGlobalRecord<T extends 'component'>(args: {
    type: T
    component: NUIComponent.Instance
    node?: HTMLElement | null
    page: NDOMPage
  }) {
    switch (args.type) {
      case 'component': {
        const createResource = globalFactory.createResource(
          GlobalComponentRecord,
        )
        const createRecord = createResource(args.type, (record) => {
          this.global.components.set(record.globalId, record)
        })
        return createRecord({
          component: args.component,
          node: args.node as HTMLElement,
          page: args.page || this.page,
        })
      }
    }
  }

  /**
   * Finds and returns the associated NDOMPage from NUIPage
   * @param NUIPage nuiPage
   * @returns NDOMPage | null
   */
  findPage(nuiPage: NUIPage | NDOMPage | string): NDOMPage
  findPage(
    pageComponent: NUIComponent.Instance,
    currentPage?: string,
  ): ComponentPage
  findPage(
    nuiPage: NUIComponent.Instance | NUIPage | NDOMPage | string,
    currentPage?: string,
  ) {
    if (isComponent(nuiPage)) {
      if (this.global.pages?.[nuiPage?.id]) return this.global.pages[nuiPage.id]
      let component = nuiPage
      let _nuiPage = component.get('page') as NUIPage
      let pagePath = component.get('path') as string
      if (i._isNUIPage(_nuiPage)) return this.findPage(_nuiPage)
      if (u.isStr(pagePath) || u.isStr(currentPage)) {
        return (
          (currentPage && this.findPage(currentPage)) || this.findPage(pagePath)
        )
      }
    } else if (i._isNUIPage(nuiPage)) {
      for (const page of u.values(this.global.pages)) {
        if (page.getNuiPage() === nuiPage) return page
        if (page.getNuiPage()?.created === nuiPage.created) return page
        if (this.findPage(page.id)?.getNuiPage?.() === nuiPage) return page
        if (this.findPage(page.page)?.getNuiPage?.() === nuiPage) return page
        if (this.findPage(page.requesting)?.getNuiPage?.() === nuiPage) {
          return page
        }
      }
      return this.findPage(nuiPage.id as string)
    } else if (isNDOMPage(nuiPage)) {
      return nuiPage
    }
    return null
  }

  on<Evt extends keyof t.Hooks>(evt: Evt, fn: t.Hooks[Evt]) {
    this.#hooks[evt].push(fn)
    return this
  }

  /**
   * Initiates a request to the parameters set in Page.
   * The page.requesting value should be set prior to calling this method unless
   * pageRequesting is provided. If it is provided, it will be set automatically
   */
  async request(page = this.page, pageRequesting = '') {
    // Cache the currently requesting page to detect for newer requests during the call
    pageRequesting = pageRequesting || page.requesting || ''
    try {
      // This is needed for the consumer to run any operations prior to working
      // with the components (ex: processing the "init" in page objects)
      await this.transact(nuiEmitTransaction.REQUEST_PAGE_OBJECT, page)
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
              `%cAborting this navigate request to ${pageRequesting} because` +
                `a more recent request for "${page.requesting}" was instantiated`,
              `color:#FF5722;`,
              { pageAborting: pageRequesting, pageRequesting: page.requesting },
            )
            delete page.modifiers[pageRequesting]
            return console.error(
              `A more recent request from "${pageRequesting}" to "${page.requesting}" was called`,
            )
          }
        } catch (error) {
          throw error
        }
      }

      page.setStatus(pageEvt.status.NAVIGATING)

      // Outside link
      if (pageRequesting.startsWith('http')) {
        await action(() => void (page.requesting = ''))
        return openOutboundURL(pageRequesting)
      }

      await action(() => {
        page.emitSync(pageEvt.on.ON_NAVIGATE_START, page)
        !i._TEST_ && history.pushState({}, '', page.pageUrl)
      })

      await action(() => {
        page.previous = page.page
        page.page = page.requesting
        page.requesting = ''
      })
    } catch (error) {
      if (pageRequesting === page.requesting) page.requesting = ''
      throw error instanceof Error ? error : new Error(error)
    }

    return {
      render: this.render.bind(this, page),
    }
  }

  /**
   * Takes a list of raw noodl components, converts them to their corresponding
   * DOM nodes and appends to the DOM
   *
   * @param { NDOMPage } page
   * @returns NUIComponent.Instance
   */
  async render(page: NDOMPage, callback?: ConsumerOptions['callback']) {
    // REMINDER: The value of this page's "requesting" is empty at this moment
    // Create the root node where we will be placing DOM nodes inside.
    // The root node is a direct child of document.body
    page.setStatus(c.eventId.page.status.RESOLVING_COMPONENTS)
    this.reset('componentCache', page)
    const nuiPage = page.getNuiPage()
    const components = u.array(
      await nui.resolveComponents({
        callback,
        components: page.components,
        page: nuiPage,
      }),
    ) as NUIComponent.Instance[]
    page.setStatus(c.eventId.page.status.COMPONENTS_RECEIVED)
    page.emitSync(c.eventId.page.on.ON_DOM_CLEANUP, {
      global: this.global,
      rootNode: page.rootNode,
    })
    /**
     * Page components use NDOMPage instances that use their rootNode as an
     * HTMLIFrameElement. They will have their own way of clearing their tree
     */
    !i._isIframeEl(page.rootNode) && page.clearRootNode()
    page.setStatus(c.eventId.page.status.RENDERING_COMPONENTS)
    page.emitSync(
      pageEvt.on.ON_BEFORE_RENDER_COMPONENTS,
      page.snapshot({ components }),
    )
    await Promise.all(components.map((c) => this.draw(c, page.rootNode, page)))
    page.emitSync(c.eventId.page.on.ON_COMPONENTS_RENDERED, page)
    page.setStatus(c.eventId.page.status.COMPONENTS_RENDERED)

    return components as NUIComponent.Instance[]
  }

  async draw_<C extends NUIComponent.Instance>(
    component: C,
    container?: t.NDOMElement | null,
    pageProp?: NDOMPage,
    options?: {
      callback?: ConsumerOptions['callback']
      context?: Record<string, any>
      /**
       * Callback called when a page component finishes loading its element in the DOM. The resolvers are run on the page node before this callback fires. The caller is responsible for handling the page component's children
       * @param options
       */
      onPageComponentLoad?(options: {
        event: Event
        node: HTMLIFrameElement
        component: C
        page: NDOMPage
      }): void
    },
  ) {
    let node: t.NDOMElement | null = null
    let vnode: t.VNode | null = null
    let page: NDOMPage = pageProp || this.page

    if (component) {
      const vnode = h(getElementTag(component), {}, [])
      if (i._isPluginComponent(component)) {
        vnode = h(getElementTag(component), {}, [])
        // We will delegate the role of the node creation to the consumer (only enabled for plugin components for now)
        // const getNode = (elem: HTMLElement) => (node = elem)
        await this.#R.run({
          ndom: this,
          vnode,
          component,
          page,
          resolvers: this.resolvers,
        })
        return createElement(vnode)
      } else if (Identify.component.image(component)) {
        if (this.#createElementBinding) {
          vnode = this.#createElementBinding(component)
        }

        if (!vnode) {
          try {
            if (Identify.folds.emit(component.blueprint?.path)) {
              try {
                vnode = h('img', { src: component.get(c.DATA_SRC) }, [])
              } catch (error) {
                console.error(error)
              }
            }
          } catch (error) {
            console.error(error)
          }
        }
        !vnode && (vnode = h('img', {}, []))
      } else {
        node = this.#createElementBinding?.(component) || null
        vnode && (vnode.properties.attributes['isElementBinding'] = true)
        !vnode && (vnode = h(getElementTag(component), {}, []))
      }

      if (component.has?.('global')) {
        i.handleDrawGlobalComponent.call(this, vnode, component, page)
      }
    }

    if (vnode) {
      const parent = component.has?.('global')
        ? document.body
        : container || document.body

      // NOTE: This needs to stay above the code below or the children will
      // not be able to access their parent during the resolver calls
      // !parent.contains(node) && parent.appendChild(node)

      if (Identify.component.page(component)) {
        if (options?.onPageComponentLoad) {
          vnode['ev-load'] = function (evt: Event) {
            return options?.onPageComponentLoad?.({
              event: evt,
              node: node as HTMLIFrameElement,
              component,
              page,
            })
          }
        } else {
          await this.#R.run({
            ndom: this,
            vnode,
            component,
            page,
            resolvers: this.resolvers,
          })
          if (!component.length) return createElement(vnode)
        }
      } else {
        await this.#R.run({
          ndom: this,
          vnode,
          component,
          page,
          resolvers: this.resolvers,
        })

        node = createElement(vnode)

        /**
         * Creating a document fragment and appending children to them is a
         * minor improvement in first contentful paint on initial loading
         * https://web.dev/first-contentful-paint/
         */
        let childrenContainer = Identify.component.list(component)
          ? document.createDocumentFragment()
          : createElement(vnode)

        for (const child of component.children) {
          const childNode = await this.draw(child, node, page, options)

          childNode && childrenContainer?.appendChild(childNode)
        }

        if (
          childrenContainer.nodeType ===
          childrenContainer.DOCUMENT_FRAGMENT_NODE
        ) {
          node && node.appendChild(childrenContainer)
        }
        childrenContainer = null as any
      }
    }
  }

  /**
   * Parses props and returns a DOM node described by props. This also
   * resolves its children hieararchy until there are none left
   * @param { Component } props
   */
  async draw<C extends NUIComponent.Instance>(
    component: C,
    container?: t.NDOMElement | null,
    pageProp?: NDOMPage,
    options?: {
      callback?: ConsumerOptions['callback']
      context?: Record<string, any>
      /**
       * Callback called when a page component finishes loading its element in the DOM. The resolvers are run on the page node before this callback fires. The caller is responsible for handling the page component's children
       * @param options
       */
      onPageComponentLoad?(options: {
        event: Event
        node: HTMLIFrameElement
        component: C
        page: NDOMPage
      }): void
    },
  ) {
    let node: t.NDOMElement | null = null
    let page: NDOMPage = pageProp || this.page

    if (component) {
      if (i._isPluginComponent(component)) {
        // We will delegate the role of the node creation to the consumer (only enabled for plugin components for now)
        const getNode = (elem: HTMLElement) => (node = elem || node)
        await this.#R.run({
          ndom: this,
          // @ts-expect-error
          node: getNode,
          component,
          page,
          resolvers: this.resolvers,
        })
        return node
      } else if (Identify.component.image(component)) {
        if (this.#createElementBinding) {
          node = this.#createElementBinding(component) as HTMLElement
        }

        try {
          if (Identify.folds.emit(component.blueprint?.path)) {
            try {
              node = (await createAsyncImageElement()).node
              ;(node as HTMLImageElement).src = component.get(c.DATA_SRC)
            } catch (error) {
              console.error(error)
            }
          }
        } catch (error) {
          console.error(error)
        } finally {
          !node && (node = document.createElement('img'))
        }
      } else {
        node = this.#createElementBinding?.(component) || null
        node && (node['isElementBinding'] = true)
        !node && (node = document.createElement(getElementTag(component)))
      }

      if (component.has?.('global')) {
        i.handleDrawGlobalComponent.call(this, node, component, page)
      }
    }

    if (node) {
      const parent = component.has?.('global')
        ? document.body
        : container || document.body

      // NOTE: This needs to stay above the code below or the children will
      // not be able to access their parent during the resolver calls
      !parent.contains(node) && parent.appendChild(node)

      if (Identify.component.page(component)) {
        if (options?.onPageComponentLoad) {
          node.addEventListener(
            'load',
            function (evt) {
              return options?.onPageComponentLoad?.({
                event: evt,
                node: node as HTMLIFrameElement,
                component,
                page,
              })
            },
            { once: true },
          )
        } else {
          await this.#R.run({
            ndom: this,
            node,
            component,
            page,
            resolvers: this.resolvers,
          })
          if (!component.length) return node
        }
      } else {
        await this.#R.run({
          ndom: this,
          node,
          component,
          page,
          resolvers: this.resolvers,
        })

        /**
         * Creating a document fragment and appending children to them is a
         * minor improvement in first contentful paint on initial loading
         * https://web.dev/first-contentful-paint/
         */
        let childrenContainer = Identify.component.list(component)
          ? document.createDocumentFragment()
          : node

        for (const child of component.children) {
          const childNode = (await this.draw(
            child,
            node,
            page,
            options,
          )) as HTMLElement

          childNode && childrenContainer?.appendChild(childNode)
        }

        if (
          childrenContainer.nodeType ===
          childrenContainer.DOCUMENT_FRAGMENT_NODE
        ) {
          node.appendChild(childrenContainer)
        }
        childrenContainer = null as any
      }
    }

    return node || null
  }

  async redraw<C extends NUIComponent.Instance>(
    node: t.NDOMElement | null, // ex: li (dom node)
    component: C, // ex: listItem (component instance)
    pageProp?: NDOMPage,
    options?: Parameters<NDOM['draw']>[3],
  ) {
    let context: any = options?.context
    let isPageComponent = Identify.component.page(component)
    let newComponent: NUIComponent.Instance | undefined
    let page =
      pageProp || (isPageComponent && this.findPage(component)) || this.page
    let parent = component.parent

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
      page?.emitSync(c.eventId.page.on.ON_REDRAW_BEFORE_CLEANUP, {
        parent: component?.parent as NUIComponent.Instance,
        component,
        context,
        node,
        page,
      })

      newComponent = createComponent(component.blueprint)

      if (parent) {
        newComponent.setParent(parent)
        parent.createChild(newComponent)
      }

      this.removeComponent(component)

      newComponent = await nui.resolveComponents?.({
        callback: options?.callback,
        components: newComponent,
        page: page?.getNuiPage?.(),
        context,
      })
    }

    if (node) {
      if (newComponent) {
        const parentNode = node.parentNode || (document.body as any)
        parentNode?.contains?.(node) && (node.textContent = '')

        this.removeNode(node)

        node = await this.draw(newComponent, parentNode, page, {
          ...options,
          context,
          onPageComponentLoad: async (args) => {
            try {
              console.log(
                `%conPageComponentLoad fired in a redraw`,
                `color:#95a5a6;`,
              )
              if (args.node && args.component) {
                const pageObject = (await this.transact(
                  'REQUEST_PAGE_OBJECT',
                  args.page,
                )) as PageObject

                console.log(
                  `%cReceived page object containing ${
                    pageObject.components?.length || 0
                  } top level components`,
                  `color:#95a5a6;`,
                )

                for (const childObject of pageObject.components) {
                  const child = await nui.resolveComponents({
                    callback: options?.callback,
                    components: childObject,
                    page: args.page.getNuiPage() || args.component.get('page'),
                  })

                  args.component.createChild(child)

                  const childNode = await this.draw(child, args.node, page, {
                    ...options,
                    context,
                  })

                  if (childNode) {
                    args.node?.appendChild(childNode)
                    console.log(
                      `%cAppended a descendant page child of "${childNode.tagName}" to a ${args.node?.tagName} element`,
                      `color:#95a5a6;`,
                      { childNode, args },
                    )
                  } else {
                    console.log(
                      `%cNo child node was found when drawing for a "${args.component?.type}" component when redrawing`,
                      `color:#ec0000;`,
                      args,
                    )
                  }
                }
              } else {
                console.log(
                  `%cDid not receive a DOM node and component inside the call to ` +
                    `onPageComponentLoad while redrawing`,
                  `color:#ec0000;`,
                )
              }
            } catch (error) {
              console.error(error)
              throw error
            }
          },
        })
      }
    }

    return [node, newComponent] as [typeof node, typeof component]
  }

  register(obj: Store.ActionObject): this
  register(obj: Store.BuiltInObject): this
  register(obj: Store.ActionObject | Store.BuiltInObject): this {
    if ('actionType' in obj || 'funcName' in obj) {
      nui.use({ [obj.actionType]: obj })
    }
    return this
  }

  reset(key: 'componentCache', page: NDOMPage): this
  reset(opts?: {
    componentCache?: boolean
    global?: boolean
    pages?: boolean
    register?: boolean
    transactions?: boolean
  }): this
  reset(key?: 'actions' | 'componentCache' | 'register' | 'transactions'): this
  reset(
    key?:
      | {
          actions?: boolean
          componentCache?: boolean
          global?: boolean
          hooks?: boolean
          pages?: boolean
          register?: boolean
          transactions?: boolean
        }
      | 'actions'
      | 'componentCache'
      | 'hooks'
      | 'register'
      | 'transactions',
    page?: NDOMPage,
  ) {
    const _pageName = page?.requesting || page?.page

    const resetActions = u.callAll(
      nuiCache.actions.clear.bind(nuiCache.actions),
      nuiCache.actions.reset.bind(nuiCache.actions),
    )
    const resetComponentCache = nuiCache.component.clear.bind(
      nuiCache.component,
    )
    const resetHooks = () => u.forEach(u.clearArr, u.values(this.hooks))
    const resetPages = () => {
      this.page = undefined as any
      u.forEach((p) => this.removePage(p), u.values(this.pages))
      nuiCache.page.clear()
    }
    const resetRegisters = nuiCache.register.clear.bind(nuiCache.register)
    const resetTransactions = nuiCache.transactions.clear.bind(
      nuiCache.transactions,
    )
    const resetGlobal = () => {
      // Global components
      u.forEach(
        (c) => this.removeGlobalRecord(c),
        [...this.global.components.values()],
      )
      // Global timers
      // TODO - check if there is a memory leak here
      u.forEach((k) => delete this.global.timers[k], u.keys(this.global.timers))
      resetPages()
    }

    if (key !== undefined) {
      if (u.isObj(key)) {
        key.componentCache && resetComponentCache(_pageName)
        key.global && resetGlobal()
        key.hooks && resetHooks()
        key.pages && resetPages()
        key.transactions && resetTransactions()
      } else if (key === 'actions') resetActions()
      else if (key === 'componentCache') resetComponentCache(_pageName)
      else if (key === 'hooks') resetHooks()
      else if (key === 'register') resetRegisters()
      else if (key === 'transactions') resetTransactions()
      return this
    }
    // The operations below is equivalent to a "full reset"
    u.callAll(
      resetActions,
      resetComponentCache,
      resetGlobal,
      resetHooks,
      resetPages,
      resetRegisters,
      resetTransactions,
    )()

    return this
  }

  resync() {
    i._syncPages.call(this)
  }

  async transact<Tid extends t.NDOMTransactionId>(
    transaction: Tid,
    ...args: Parameters<t.NDOMTransaction[Tid]>
  ) {
    if (transaction === nuiEmitTransaction.REQUEST_PAGE_OBJECT) {
      u.forEach(
        (fn) => fn?.(args[0] as any),
        this.#hooks.onBeforeRequestPageObject,
      )
    }
    // @ts-expect-error
    const result = nuiCache.transactions.get(transaction)?.['fn']?.(...args)
    if (transaction === nuiEmitTransaction.REQUEST_PAGE_OBJECT) {
      u.forEach(
        (fn) => fn?.(args[0] as any),
        this.#hooks.onAfterRequestPageObject,
      )
    }
    return result
  }

  removeComponent(component: NUIComponent.Instance | undefined | null) {
    if (!component) return
    const remove = (_c: NUIComponent.Instance) => {
      nuiCache.component.remove(_c)
      ;(_c.has?.('global') || _c.blueprint?.global) &&
        this.removeGlobalComponent(_c.get(c.DATA_GLOBALID))
      _c?.setParent?.(null)
      _c?.parent?.removeChild(_c)
      _c.children?.forEach?.((_c) => remove(_c))
      _c.has('page') && _c.remove('page')
      _c.clear?.()
    }
    remove(component)
  }

  removeGlobalComponent(globalMap: t.GlobalMap, globalId = '') {
    if (globalId) {
      if (globalMap.components.has(globalId)) {
        const globalComponentObj = globalMap.components.get(globalId)
        const obj = globalComponentObj?.toJSON()
        if (obj) {
          const { componentId, nodeId } = obj
          if (componentId) {
            if (nuiCache.component.has(componentId)) {
              this.removeComponent(
                nuiCache.component.get(componentId)?.component,
              )
            }
          }
          this.global.components.delete(globalId)
          if (nodeId) {
            const node = document.querySelector(
              `[data-key="${globalId}"]`,
            ) as HTMLElement
            node && this.removeNode(node)
          }
        }
      }
    }
  }

  removeGlobalRecord({ componentId, globalId, nodeId }: GlobalComponentRecord) {
    nodeId && document.getElementById(nodeId)?.remove?.()
    if (nuiCache.component.has(componentId)) {
      this.removeComponent(nuiCache.component.get(componentId)?.component)
    }
    this.removeGlobalComponent(this.global, globalId)
  }

  /**
   * Removes the node from the DOM by parent/child references
   */
  removeNode(node: t.NDOMElement) {
    if (node) {
      try {
        node.parentNode?.removeChild?.(node)
        node.remove?.()
      } catch (error) {
        console.error(error)
      }
    }
  }

  /**
   * Removes the NDOMPage from the {@link GlobalMap}
   */
  removePage(page: NDOMPage | undefined | null) {
    if (page) {
      const id = page.id
      nui.clean(page.getNuiPage(), console.log)
      page.remove()
      if (this?.global?.pages) {
        if (id in this.global.pages) delete this.global.pages[id]
      }
      try {
        if (isComponentPage(page)) {
          page.clear()
        } else {
          page.remove()
          page?.rootNode?.remove?.()
        }
      } catch (error) {
        console.error(error)
      }
      page = null
    }
  }

  use(obj: NUIPage | Partial<t.UseObject>) {
    if (!obj) return
    if (i._isNUIPage(obj)) return this.findPage(obj) || this.createPage(obj)

    const { createElementBinding, register, resolver, transaction, ...rest } =
      obj

    createElementBinding && (this.#createElementBinding = createElementBinding)
    resolver && this.consumerResolvers.push(resolver)

    if (transaction) {
      u.eachEntries(transaction, (id, val) => {
        if (id === nuiEmitTransaction.REQUEST_PAGE_OBJECT) {
          nui.use({
            transaction: {
              [nuiEmitTransaction.REQUEST_PAGE_OBJECT]: async (
                nuiPage: NUIPage,
              ) => {
                invariant(
                  u.isFnc(transaction[nuiEmitTransaction.REQUEST_PAGE_OBJECT]),
                  `Missing transaction: ${nuiEmitTransaction.REQUEST_PAGE_OBJECT}`,
                )
                let page = this.findPage(nuiPage)
                if (page) {
                  !page.requesting && (page.requesting = nuiPage?.page || '')
                } else {
                  page = this.createPage(nuiPage)
                  page.requesting = nuiPage.page
                }
                return transaction[nuiEmitTransaction.REQUEST_PAGE_OBJECT]?.(
                  page,
                )
              },
            },
          })
        } else {
          nui.use({ transaction: { [id]: val } })
        }
      })
    }

    nui.use(rest)
    return this
  }
}

export default NDOM
