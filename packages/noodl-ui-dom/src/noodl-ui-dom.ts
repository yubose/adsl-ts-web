import { ActionType, ComponentObject, Identify } from 'noodl-types'
import {
  Component,
  createComponent,
  findParent,
  isPage,
  NOODLUI as NUI,
  Page as NUIPage,
  NUIComponent,
  publish,
  Store,
} from 'noodl-ui'
import { isEmitObj, isPluginComponent } from 'noodl-utils'
import {
  createAsyncImageElement,
  getShape,
  getTagName,
  isPageConsumer,
} from './utils'
import createResolver from './createResolver'
import NOODLDOMInternal from './Internal'
import MiddlewareUtils from './MiddlewareUtils'
import Page from './Page'
import * as defaultResolvers from './resolvers'
import * as c from './constants'
import * as u from './utils/internal'
import * as T from './types'

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

  get actions() {
    return NOODLDOM._nui.getActions() as {
      [K in ActionType]: Store.ActionObject[]
    }
  }

  get builtIns() {
    return NOODLDOM._nui.getBuiltIns() as {
      [funcName: string]: Store.BuiltInObject[]
    }
  }

  get length() {
    return Object.keys(this.global.pages).length
  }

  get pages() {
    return this.global.pages
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

    if (isPage(args)) {
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

  /**
   * Takes a list of raw NOODL components, converts to DOM nodes and appends to the DOM
   * @param { ComponentObject | ComponentObject[] } components
   */
  render(page: Page) {
    const currentPage = page.state.current

    page.reset('render')

    if (page.rootNode && page.rootNode.id === currentPage) {
      return console.log(
        `%cSkipped rendering the DOM for page "${currentPage}" because the DOM ` +
          `nodes are already rendered`,
        `color:#ec0000;font-weight:bold;`,
        page.snapshot(),
      )
    }

    // Create the root node where we will be placing DOM nodes inside.
    // The root node is a direct child of document.body
    page.setStatus(c.eventId.page.status.RESOLVING_COMPONENTS)

    const resolved = NOODLDOM._nui.resolveComponents.call(NOODLDOM._nui, {
      components: rawComponents,
      page: page.getNuiPage(),
    })

    page.setStatus(c.eventId.page.status.COMPONENTS_RECEIVED)

    const components = u.isArr(resolved) ? resolved : [resolved]

    page.emitSync(c.eventId.page.on.ON_DOM_CLEANUP, page.rootNode)

    page.clearRootNode()

    page.setStatus(c.eventId.page.status.RENDERING_COMPONENTS)

    components.forEach((component) => this.draw(component, page.rootNode, page))

    page.setStatus(c.eventId.page.status.COMPONENTS_RENDERED)

    return components
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
      if (isPluginComponent(component)) {
        // We will delegate the role of the node creation to the consumer
        const getNode = (elem: HTMLElement) => (node = elem)
        this.#R.run(getNode, component)
        return node
      } else if (Identify.component.image(component)) {
        node = isEmitObj(component.get('path'))
          ? createAsyncImageElement(
              (container || document.body) as HTMLElement,
              {},
            )
          : document.createElement('img')
      } else {
        node = document.createElement(getTagName(component))
      }

      if (component.has('global')) {
        const globalId = (
          this.#middleware.createGlobalComponentId ||
          this.#middleware.inst.createGlobalComponentId
        )?.(page, component)

        component.edit({ globalId })

        this.global.components[globalId] = {
          componentId: component.id,
          globalId,
          pageId: page.id as string,
          node,
        }
      }

      if (node) {
        const parent = container || document.body
        parent.appendChild(node)

        this.#R.run(node, component)

        component.children?.forEach?.((child: Component) => {
          const childNode = this.draw(child, node) as HTMLElement
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
    let page = pageProp || this.page
    let newNode: T.NOODLDOMElement | null = null
    let newComponent: Component | undefined

    if (component) {
      const parent = component.parent
      const shape = getShape(component)
      const _isPageConsumer = isPageConsumer(component)
      // Clean up state from the component
      component.clear()
      // Remove the parent reference
      component.setParent?.(null)
      page.emitSync(c.eventId.page.on.ON_REDRAW_BEFORE_CLEANUP, node, component)
      // Deeply walk down the tree hierarchy
      publish(component, (c) => {
        if (c) {
          const cParent = c.parent
          // Remove listeners
          c.clear()
          // Remove child component references
          cParent?.removeChild?.(c)
          // Remove the child's parent reference
          c.setParent?.(null)
        }
      })
      // Create the new component
      newComponent = createComponent(shape)

      let resolveComponents: any | undefined

      if (parent && newComponent) {
        // Set the original parent on the new component
        newComponent.setParent(parent)
        // Remove the child reference from the parent
        parent?.removeChild?.(component)
        // Set the new component as a child on the parent
        parent.createChild(newComponent)
      }
      if (_isPageConsumer) {
        const page = findParent(component, Identify.component.page)
        resolveComponents = NUI.resolveComponents.bind(page)
      }
      if (!resolveComponents) {
        resolveComponents = NUI.resolveComponents?.bind?.(NUI)
      }
      newComponent = resolveComponents?.(newComponent) || newComponent
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
      this.draw(newComponent as NUIComponent.Instance)
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
      NUI.use(obj)
    }
    return this
  }

  resolvers() {
    return this.#R.get()
  }

  reset(opts?: { global?: boolean; pages?: boolean; resolvers?: boolean }): this
  reset(key?: 'resolvers'): this
  reset(
    key?:
      | { global?: boolean; pages?: boolean; resolvers?: boolean }
      | 'resolvers',
  ) {
    const resetPages = () => {
      this.page = undefined as any
      u.keys(this.pages).forEach((k) => delete this.pages[k])
    }
    const resetResolvers = () => (this.resolvers().length = 0)
    const resetGlobal = () => {
      resetPages()
      u.keys(this.global.components).forEach(
        (k) => delete this.global.components[k],
      )
    }
    if (key !== undefined) {
      if (u.isObj(key)) {
        key.global && resetGlobal()
        key.pages && resetPages()
        key.resolvers && resetResolvers()
        return this
      } else if (key === 'resolvers') {
        resetResolvers()
        return this
      }
    }
    // The operations below is equivalent to a "full reset"
    resetGlobal()
    resetPages()
    resetResolvers()
    return this
  }

  use(nuiPage: NUIPage): Page
  use(opts: T.UseObject): this
  use(obj: NUIPage | T.UseObject) {
    if (isPage(obj)) {
      return this.createPage(obj)
    } else if (u.isObj(obj)) {
      if (obj.createGlobalComponentId) {
        this.#middleware.createGlobalComponentId = obj.createGlobalComponentId
      }
    }
    return this
  }
}

export default NOODLDOM
