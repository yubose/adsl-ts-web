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
  nuiEmitTransaction,
} from 'noodl-ui'
import { getFirstByGlobalId, getElementTag, openOutboundURL } from './utils'
import {
  GlobalComponentRecord,
  GlobalCssResourceRecord,
  GlobalJsResourceRecord,
} from './global'
import { resourceTypes } from './utils/internal'
import createAsyncImageElement from './utils/createAsyncImageElement'
import createResolver from './createResolver'
import createResourceObject from './utils/createResourceObject'
import isNDOMPage from './utils/isPage'
import isCssResourceRecord from './utils/isCssResourceRecord'
import isJsResourceRecord from './utils/isJsResourceRecord'
import renderResource from './utils/renderResource'
import NDOMInternal from './Internal'
import NDOMPage from './Page'
import Timers from './global/Timers'
import * as defaultResolvers from './resolvers'
import * as c from './constants'
import * as t from './types'

const pageEvt = c.eventId.page

class NDOM<ResourceKey extends string = string> extends NDOMInternal {
  #R: ReturnType<typeof createResolver>
  #createElementBinding = undefined as t.UseObject['createElementBinding']
  global: t.GlobalMap<ResourceKey> = {
    components: new Map(),
    pages: {},
    resources: {
      css: {},
      js: {},
    },
    timers: new Timers(),
  }

  page: NDOMPage // This is the main (root) page. All other pages are stored in this.#pages

  static _nui: typeof NUI

  // TODO - Deperec
  constructor(nui?: typeof NUI) {
    super()
    this.#R = createResolver(this)
    this.#R.use(this)
    u.values(defaultResolvers).forEach(this.#R.use.bind(this.#R))
    if (nui) {
      NDOM._nui = nui
      NDOMInternal._nui = nui
    } else {
      NDOM._nui = NDOMInternal._nui
    }
  }

  get actions() {
    return this.cache.actions
  }

  get builtIns() {
    return this.actions.builtIn
  }

  get cache() {
    return NDOM._nui.cache
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
        page = new NDOMPage(NDOM._nui.createPage(args))
      }
    } else {
      page = new NDOMPage(NDOM._nui.createPage())
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
      | (t.GetGlobalResourceObjectAlias<Type> &
          Partial<t.GlobalResourceObject<Type>> & {
            loadToDOM?: boolean
          }),
  ) => {
    let resourceObject = createResourceObject(resource)

    invariant(
      resourceTypes.includes(resourceObject.type),
      `"${
        resourceObject.type
      }" is not a supported resource type yet. Supported types are: ${resourceTypes.join(
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
            ((node) => globalResourceObject.onLoad?.({ node, record })),
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
  findPage(nuiPage: NUIPage | NDOMPage) {
    if (isNUIPage(nuiPage)) {
      for (const page of u.values(this.global.pages)) {
        if (page.getNuiPage() === nuiPage) return page
      }
    } else if (isNDOMPage(nuiPage)) {
      return nuiPage
    }
    return null
  }

  /**
   * Removes the NDOMPage from the {@link GlobalMap}
   */
  removePage(page: NDOMPage | undefined | null) {
    if (page) {
      page.remove()
      if (page.id in this.global.pages) delete this.global.pages[page.id]
      page = null
    }
  }

  /**
   * Removes the component from the {@link ComponentCache}
   */
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
                this.removeComponent(
                  this.cache.component.get(componentId)?.component,
                )
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

  /**
   * Removes the node from the DOM
   */
  removeNode(node: t.NOODLDOMElement) {
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
              `%cAborting this navigate request to ${pageRequesting} because a more ` +
                `recent request for "${page.requesting}" was instantiated`,
              `color:#FF5722;`,
              { pageAborting: pageRequesting, pageRequesting: page.requesting },
            )
            await page.emitAsync(pageEvt.on.ON_NAVIGATE_ABORT, page.snapshot())
            // Remove the page modifiers so they don't propagate to subsequent navigates
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
   * Takes a list of raw noodl components, converts them to their corresponding
   * DOM nodes and appends to the DOM
   * @param { NDOMPage } page
   * @returns NUIComponent.Instance
   */
  render(page: NDOMPage) {
    page.reset('render')
    // Create the root node where we will be placing DOM nodes inside.
    // The root node is a direct child of document.body
    page.setStatus(c.eventId.page.status.RESOLVING_COMPONENTS)

    this.reset('componentCache', page)

    const nuiPage = page.getNuiPage()
    const components = u.array(
      NDOM._nui.resolveComponents.call(NDOM._nui, {
        components: page.components,
        page: nuiPage,
      }),
    ) as NUIComponent.Instance[]

    page.setStatus(c.eventId.page.status.COMPONENTS_RECEIVED)

    page.emitSync(c.eventId.page.on.ON_DOM_CLEANUP, {
      global: this.global,
      rootNode: page.rootNode,
    })

    if (page.rootNode.tagName !== 'IFRAME') page.clearRootNode()

    page.setStatus(c.eventId.page.status.RENDERING_COMPONENTS)

    page.emitSync(
      pageEvt.on.ON_BEFORE_RENDER_COMPONENTS,
      page.snapshot({ components }),
    )

    // Handle high level (global) resources here so the component resolvers only worry about handling the more narrow (low level) ones
    for (const globalResources of u.values(this.global.resources)) {
      for (const { record, onLoad, isActive } of u.values(globalResources)) {
        if (record && !isActive()) {
          renderResource(record, (node) => onLoad?.({ node, record }))
        }
      }
    }

    components.forEach((component) =>
      this.draw(
        component,
        page.rootNode?.tagName === 'IFRAME'
          ? (page.rootNode as HTMLIFrameElement).contentDocument?.body
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
  draw<C extends Component = any>(
    component: C,
    container?: t.NOODLDOMElement | null,
    pageProp?: NDOMPage,
    options?: { context?: Record<string, any>; node?: HTMLElement | null },
  ) {
    let node: t.NOODLDOMElement | null = options?.node || null
    let page: NDOMPage = pageProp || this.page

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
              this.cache.component.get(globalRecord.componentId)?.component,
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
    node: t.NOODLDOMElement | null, // ex: li (dom node)
    component: Component, // ex: listItem (component instance)
    pageProp?: NDOMPage,
    options?: Parameters<NDOM['draw']>[3],
  ) {
    let context: any = options?.context
    let newNode: t.NOODLDOMElement | null = null
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
        NDOM._nui.resolveComponents?.({
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
  register(obj: t.Resolve.Config): this
  register(
    obj: t.Resolve.Config | Store.ActionObject | Store.BuiltInObject,
  ): this {
    if ('resolve' in obj) {
      this.#R.use(obj)
    } else if ('actionType' in obj || 'funcName' in obj) {
      NDOM._nui.use({ [obj.actionType]: obj })
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
    page?: NDOMPage,
  ) {
    const resetActions = () => {
      NDOM._nui.cache.actions.clear()
      NDOM._nui.cache.actions.reset()
    }
    const resetComponentCache = () => {
      NDOM._nui.cache.component.clear(page?.requesting || page?.page)
    }
    const resetPages = () => {
      this.page = undefined as any
      u.eachEntries(this.pages, (pageName, page: NDOMPage) => {
        delete this.pages[pageName]
        page?.reset?.()
      })
      NDOM._nui.cache.page.clear()
    }
    const resetRegisters = () => NDOM._nui.cache.register.clear()
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
              this.removeComponent(
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
      NDOM._nui.cache.transactions.clear()
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
          NDOM._nui.use({
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
          NDOM._nui.use({ transaction: { [id]: val } })
        }
      })
    }

    NDOM._nui.use(rest)
    return this
  }
}

export default NDOM
