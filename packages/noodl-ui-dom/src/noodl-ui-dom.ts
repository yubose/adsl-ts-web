import invariant from 'invariant'
import { Identify, PageObject } from 'noodl-types'
import * as u from '@jsmanifest/utils'
import {
  ConsumerOptions,
  createComponent,
  findIteratorVar,
  isComponent,
  isPage as isNUIPage,
  NUI,
  NUIComponent,
  nuiEmitTransaction,
  Page as NUIPage,
  Store,
} from 'noodl-ui'
import { getElementTag, openOutboundURL } from './utils'
import {
  GlobalComponentRecord,
  GlobalCssResourceRecord,
  GlobalJsResourceRecord,
} from './global/index'
import createAsyncImageElement from './utils/createAsyncImageElement'
import createResolver from './createResolver'
import createResourceObject from './utils/createResourceObject'
import isNDOMPage from './utils/isPage'
import isCssResourceRecord from './utils/isCssResourceRecord'
import renderResource from './utils/renderResource'
import NDOMInternal from './Internal'
import NDOMGlobal from './Global'
import NDOMPage from './Page'
import { cache as nuiCache, nui } from './nui'
import attributeResolvers from './resolvers/attributes'
import componentResolvers from './resolvers/components'
import * as i from './utils/internal'
import * as c from './constants'
import * as t from './types'

const pageEvt = c.eventId.page

class NDOM extends NDOMInternal {
  #R: ReturnType<typeof createResolver>
  #createElementBinding = undefined as t.UseObject['createElementBinding']
  #hooks = { onRedrawStart: [] } as Record<
    keyof t.Hooks,
    t.Hooks[keyof t.Hooks][]
  >
  global = new NDOMGlobal()
  page: NDOMPage // This is the main (root) page. All other pages are stored in this.global.pages

  constructor() {
    super()
    this.#R = createResolver(this)
    this.#R.use(this)
    ;[attributeResolvers, componentResolvers].forEach((r) => this.#R.use(r))
  }

  get actions() {
    return this.cache.actions
  }

  get builtIns() {
    return this.actions.builtIn
  }

  get cache() {
    return nuiCache
  }

  get length() {
    return u.keys(this.global.pages).length
  }

  get pages() {
    return this.global.pages
  }

  get resources() {
    return u.values(this.global.resources)
  }

  get transactions() {
    return this.cache.transactions
  }

  createPage(nuiPage?: NUIPage): NDOMPage
  createPage(args: Parameters<typeof NUI['createPage']>[0]): NDOMPage
  createPage(args: {
    page: NUIPage
    viewport?: { width?: number; height?: number }
  }): NDOMPage
  createPage(name: string): NDOMPage
  createPage(
    args?:
      | NUIPage
      | Parameters<typeof NUI['createPage']>[0]
      | { page: NUIPage; viewport?: { width?: number; height?: number } }
      | string,
  ) {
    let page: NDOMPage | undefined

    if (isNUIPage(args)) {
      page = this.findPage(args) || new NDOMPage(args)
    } else if (u.isObj(args)) {
      if ('page' in args) {
        page = this.findPage(args.page) || new NDOMPage(args.page)
      } else {
        page = new NDOMPage(nui.createPage(args) as NUIPage)
      }
    } else {
      page = new NDOMPage(nui.createPage() as NUIPage)
    }

    if (page) {
      this.global.pages[page.id] !== page && (this.global.pages[page.id] = page)
      !this.page && (this.page = page)
    }

    return page
  }

  createGlobalRecord(
    args:
      | {
          type: 'component'
          component: NUIComponent.Instance
          id?: string
          node?: HTMLElement | null
          page: NDOMPage
        }
      | { type: 'page' },
  ) {
    switch (args.type) {
      case 'component': {
        const { type, page, ...rest } = args
        const record = new GlobalComponentRecord({
          ...rest,
          page: page || this.page,
        })
        this.global.components.set(record.globalId, record)
        return record
      }
      case 'page':
        break
      default:
        break
    }
  }

  /**
   * Creates a resource record object to the global map. If `lazyLoad` is true, the element will not load to the DOM until `render` is called
   * @param t.UseObjectGlobalResource resource
   * @returns GlobalResourceRecord
   */
  createResource = <Type extends t.GlobalResourceType>(
    resource:
      | string
      | (t.GetGlobalResourceObjectAlias<Type> & {
          loadToDOM?: boolean
        }),
  ) => {
    let resourceObject = createResourceObject(resource)

    invariant(
      i.resourceTypes.includes(resourceObject.type),
      `"${
        resourceObject.type
      }" is not a supported resource type yet. Supported types are: ${i.resourceTypes.join(
        ', ',
      )}`,
    )

    const record =
      resourceObject.type === 'css'
        ? new GlobalCssResourceRecord(resourceObject)
        : new GlobalJsResourceRecord(resourceObject)

    const recordId = isCssResourceRecord(record) ? record.href : record.src

    const globalResourceObject = {
      record,
      isActive: () => {
        try {
          if (resourceObject.type === 'css') {
            return (
              document.head.querySelector(`link[href="${recordId}"]`) != null
            )
          }
          return document.getElementById(recordId) != null
        } catch (error) {
          console.error(`[Error in [get] active accessor]`, error)
          return false
        }
      },
    } as t.GlobalResourceObject<Type>

    this.global.resources[record.resourceType][recordId] = globalResourceObject

    if (u.isObj(resource)) {
      for (const [key, value] of u.entries(resource)) {
        if (key === 'onCreateRecord') {
          globalResourceObject.onCreateRecord = resource.onCreateRecord
          globalResourceObject.onCreateRecord?.(record)
        } else if (key === 'onLoad') {
          globalResourceObject.onLoad = resource.onLoad
        } else {
          globalResourceObject[key as keyof t.GlobalResourceObject<Type>] =
            value
        }
      }

      if (resource.loadToDOM === true) {
        renderResource(
          record,
          globalResourceObject.onLoad &&
            (({ node }) => globalResourceObject.onLoad?.({ node, record })),
        )
      }
    }

    return record as t.GetGlobalResourceRecordAlias<Type>
  }

  /**
   * Finds and returns the associated NDOMPage from NUIPage
   * @param NUIPage nuiPage
   * @returns NDOMPage | null
   */
  findPage(nuiPage: NUIPage | NDOMPage | string): NDOMPage
  findPage(pageComponent: NUIComponent.Instance, currentPage: string): NDOMPage
  findPage(
    nuiPage: NUIComponent.Instance | NUIPage | NDOMPage | string,
    currentPage?: string,
  ) {
    // TODO - Finish this isComponent block
    if (isComponent(nuiPage)) {
      const page = nuiPage.get('page') as NUIPage
      if (!page) {
        const pagePath = nuiPage.get('path')
        if (u.isStr(pagePath) && pagePath) return this.findPage(pagePath)
      }
    } else if (isNUIPage(nuiPage)) {
      for (const page of u.values(this.global.pages)) {
        if (page.getNuiPage() === nuiPage || page.page === nuiPage.page)
          return page
      }
    } else if (isNDOMPage(nuiPage)) {
      return nuiPage
    } else if (u.isStr(nuiPage)) {
      return u
        .values(this.pages)
        .find(
          (page) =>
            page.page === nuiPage ||
            page.page === currentPage ||
            page.id === nuiPage,
        )
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

      const ndomPageIds = u.keys(this.global.pages)

      if (ndomPageIds.length !== this.cache.page.length) {
        console.log(
          `%cThe number of NDOM pages is ${ndomPageIds.length} and NUI pages is ${this.cache.page.length}. They should be in sync`,
          `color:#ec0000;`,
        )
      }

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
        if (process.env.NODE_ENV !== 'test') {
          history.pushState({}, '', page.pageUrl)
        }
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
      render: (callback?: ConsumerOptions['callback']) =>
        this.render(page, callback),
    }
  }

  /**
   * Takes a list of raw noodl components, converts them to their corresponding
   * DOM nodes and appends to the DOM
   *
   * @param { NDOMPage } page
   * @returns NUIComponent.Instance
   */
  render(page: NDOMPage, callback?: ConsumerOptions['callback']) {
    // REMINDER: The value of this page's "requesting" is empty at this moment
    // Create the root node where we will be placing DOM nodes inside.
    // The root node is a direct child of document.body
    page.setStatus(c.eventId.page.status.RESOLVING_COMPONENTS)

    this.reset('componentCache', page)

    const nuiPage = page.getNuiPage()
    const components = u.array(
      nui.resolveComponents.call(nui, {
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
    if (page.rootNode.tagName !== 'IFRAME') page.clearRootNode()

    page.setStatus(c.eventId.page.status.RENDERING_COMPONENTS)

    page.emitSync(
      pageEvt.on.ON_BEFORE_RENDER_COMPONENTS,
      page.snapshot({ components }),
    )

    // Handle high level (global) resources here so the component resolvers only worry about handling the more narrow (low level) ones
    for (const globalResources of u.values(this.global.resources)) {
      for (const { record, lazyLoad, onLoad, isActive } of u.values(
        globalResources,
      )) {
        if (record && !lazyLoad && !isActive()) {
          renderResource(record, ({ node }) => onLoad?.({ node, record }))
        }
      }
    }

    components.forEach((component) =>
      this.draw(
        component,
        page.tagName === 'iframe'
          ? page.rootNode.contentDocument?.body
          : page.rootNode,
        page,
      ),
    )

    page.emitSync(c.eventId.page.on.ON_COMPONENTS_RENDERED, page)

    page.setStatus(c.eventId.page.status.COMPONENTS_RENDERED)

    return components as NUIComponent.Instance[]
  }

  /**
   * Parses props and returns a DOM node described by props. This also
   * resolves its children hieararchy until there are none left
   * @param { Component } props
   */
  draw<C extends NUIComponent.Instance>(
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
      if (
        [
          Identify.component.plugin,
          Identify.component.pluginHead,
          Identify.component.pluginBodyTop,
          Identify.component.pluginBodyTail,
        ].some((cond) => cond(component))
      ) {
        // We will delegate the role of the node creation to the consumer
        const getNode = (elem: HTMLElement) => (node = elem || node)
        // @ts-expect-error
        this.#R.run({ node: getNode, component })
        return node
      } else if (Identify.component.image(component)) {
        if (this.#createElementBinding) {
          node = this.#createElementBinding(component) as HTMLElement
        }
        !node &&
          (node = Identify.folds.emit(component.get('path'))
            ? createAsyncImageElement(
                (container || document.body) as HTMLElement,
                {},
              )
            : document.createElement('img'))
      } else if (Identify.component.list(component)) {
        node = document.createElement(getElementTag(component))
      } else {
        node = this.#createElementBinding?.(component) || null
        node && (node['isElementBinding'] = true)
        !node && (node = document.createElement(getElementTag(component)))
      }

      if (component.has?.('global')) {
        i.handleDrawGlobalComponent.call(this, node, component, page)
      }

      if (node) {
        const parent = component.has?.('global')
          ? document.body
          : container || document.body

        // NOTE: This needs to stay above the code below or the children will
        // not be able to access their parent during the resolver calls
        !parent.contains(node) && parent.appendChild(node)

        if (node instanceof HTMLIFrameElement) {
          if (Identify.component.page(component)) {
            if (options?.onPageComponentLoad) {
              node.addEventListener('load', function (evt) {
                options?.onPageComponentLoad?.({
                  event: evt,
                  node: node as HTMLIFrameElement,
                  component,
                  page,
                })
              })
            } else {
              if (
                !['.html'].some((ext) => component.get('path')?.endsWith?.(ext))
              ) {
                this.#R.run({ node, component })
                component.children?.forEach?.(
                  (child: NUIComponent.Instance) => {
                    if (node instanceof HTMLIFrameElement) {
                      node.contentDocument?.body.appendChild(
                        this.draw(child, node, page, options) as HTMLElement,
                      )
                    } else {
                      node?.appendChild(
                        this.draw(child, node, page, options) as HTMLElement,
                      )
                    }
                  },
                )
              } else {
                node.addEventListener(
                  'load',
                  (evt) => {
                    console.log(`Page component loaded`, evt)
                    let nuiPage = component.get('page') as NUIPage
                    let ndomPage = (this.findPage(nuiPage) ||
                      this.createPage(nuiPage)) as NDOMPage
                    let src = component.get(c.DATA_SRC) || ''

                    if (node) {
                      if (
                        ndomPage.id !== 'root' &&
                        ndomPage.rootNode !== node
                      ) {
                        try {
                          i._removeNode(ndomPage.rootNode)
                          ndomPage.rootNode = node as HTMLIFrameElement
                        } catch (error) {
                          console.error(error)
                        }
                      }
                      this.#R.run({ node: ndomPage.rootNode, component, })
                      if (!src) {
                        // TODO
                      }
                      ;(node as HTMLIFrameElement).src = src
                    } else {
                      // TODO
                    }
                  },
                  { once: true },
                )

                node?.addEventListener('error', function (err) {
                  console.error(err)
                })
              }
            }
          }
        } else {
          this.#R.run({ node, component })
          component.children?.forEach?.((child: NUIComponent.Instance) => {
            const childNode = this.draw(
              child,
              node,
              page,
              options,
            ) as HTMLElement
            childNode && node?.appendChild(childNode)
          })
        }
      }
    }
    return node || null
  }

  redraw<C extends NUIComponent.Instance>(
    node: t.NDOMElement | null, // ex: li (dom node)
    component: C, // ex: listItem (component instance)
    pageProp?: NDOMPage,
    options?: Parameters<NDOM['draw']>[3],
  ) {
    let context: any = options?.context
    let isPageComponent = Identify.component.page(component)
    let newComponent: NUIComponent.Instance | undefined
    let page =
      pageProp ||
      (isPageComponent && this.findPage(component.get('page'))) ||
      this.page
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

      i._removeComponent(component)

      newComponent = nui.resolveComponents?.({
        callback: options?.callback,
        components: newComponent,
        page: page.getNuiPage(),
        context,
      })
    }

    if (node) {
      if (newComponent) {
        const parentNode = node.parentNode || (document.body as any)
        parentNode?.contains?.(node) && (node.textContent = '')

        i._removeNode(node)

        node = this.draw(newComponent, parentNode, page, {
          ...options,
          context,
          onPageComponentLoad: async (args) => {
            try {
              if (args.node && args.component) {
                const pageObject = (await this.transact(
                  'REQUEST_PAGE_OBJECT',
                  args.page,
                )) as PageObject

                u.array(pageObject.components).forEach((childObject) => {
                  const child = nui.resolveComponents({
                    callback: options?.callback,
                    components: childObject,
                    page: args.page.getNuiPage() || args.component.get('page'),
                  })

                  args.component.createChild(child)

                  const childNode = this.draw(child, args.node, page, {
                    ...options,
                    context,
                  })

                  childNode && args.node?.appendChild(childNode)
                })
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
  register(obj: t.Resolve.Config): this
  register(
    obj: t.Resolve.Config | Store.ActionObject | Store.BuiltInObject,
  ): this {
    if ('resolve' in obj) {
      this.#R.use(obj)
    } else if ('actionType' in obj || 'funcName' in obj) {
      nui.use({ [obj.actionType]: obj })
    }
    return this
  }

  resolvers() {
    return this.#R.get()
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
          pages?: boolean
          register?: boolean
          transactions?: boolean
        }
      | 'actions'
      | 'componentCache'
      | 'register'
      | 'transactions',
    page?: NDOMPage,
  ) {
    const resetActions = () => {
      nui.cache.actions.clear()
      nui.cache.actions.reset()
    }
    const resetComponentCache = () => {
      nui.cache.component.clear(page?.requesting || page?.page)
    }
    const resetPages = () => {
      this.page = undefined as any
      u.eachEntries(this.pages, (pageName, page: NDOMPage) => {
        delete this.pages[pageName]
        page?.reset?.()
      })
      nui.cache.page.clear()
    }
    const resetRegisters = () => nui.cache.register.clear()
    const resetResolvers = () => void (this.resolvers().length = 0)
    const resetGlobal = () => {
      resetPages()
      u.keys(this.global).forEach((k) => {
        if (k === 'components') {
          const record = this.global.components.get(k)
          if (record) {
            if (record.nodeId) {
              document.getElementById(record.nodeId)?.remove?.()
            }
            if (this.cache.component.has(record.componentId)) {
              i._removeComponent(
                this.cache.component.get(record.componentId)?.component,
              )
            }
          }
          this.global.components.delete(record?.globalId as string)
        } else if (k === 'pages') {
          //
        } else if (k === 'resources') {
          u.keys(this.global.resources).forEach((resourceType) => {
            u.entries(this.global.resources[resourceType]).forEach(
              ([key, obj]) => {
                u.keys(obj).forEach((k) => delete obj[k])
                delete this.global.resources[resourceType][key]
              },
            )
          })
        } else if (k === 'timers') {
          // TODO - check if there is a memory leak
          u.eachEntries(this.global.timers, (k) => {
            delete this.global.timers[k]
          })
        }
      })
    }
    const resetTransactions = () => {
      nui.cache.transactions.clear()
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
    resetTransactions()
    return this
  }

  async transact<Tid extends t.NDOMTransactionId>(
    transaction: Tid,
    ...args: Parameters<t.NDOMTransaction[Tid]>
  ) {
    return this.cache.transactions.get(transaction)?.['fn' as any]?.(...args)
  }

  use(obj: NUIPage | Partial<t.UseObject>) {
    if (!obj) return
    if (isNUIPage(obj)) return this.createPage(obj)

    const {
      createElementBinding,
      register,
      resource,
      transaction,
      resolver,
      ...rest
    } = obj

    createElementBinding && (this.#createElementBinding = createElementBinding)
    resolver && this.register(resolver)

    if (resource) {
      u.array(resource).forEach((r) => this.createResource(r))
    }

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

                let pageObject: PageObject | undefined
                let page = this.findPage(nuiPage)

                if (page) {
                  !page.requesting && (page.requesting = nuiPage?.page || '')
                } else {
                  page = this.createPage(nuiPage)
                  page.requesting = nuiPage.page
                }

                pageObject = await transaction[
                  nuiEmitTransaction.REQUEST_PAGE_OBJECT
                ]?.(page)

                return pageObject
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
