import { ActionType, ComponentObject, Identify } from 'noodl-types'
import {
  Component,
  createComponent,
  findParent,
  NOODLUI as NUI,
  publish,
  Store,
} from 'noodl-ui'
import { isEmitObj, isPluginComponent } from 'noodl-utils'
import { eventId } from './constants'
import {
  createAsyncImageElement,
  getShape,
  getTagName,
  isPageConsumer,
} from './utils'
import createResolver from './createResolver'
import NOODLDOMInternal from './Internal'
import Page from './Page'
import * as defaultResolvers from './resolvers'
import * as u from './utils/internal'
import * as T from './types'

class NOODLOM extends NOODLDOMInternal {
  #R: ReturnType<typeof createResolver>
  page: Page

  constructor() {
    super()
    this.page = new Page(this.render.bind(this))
    this.#R = createResolver(this)
    this.#R.use(this)
    u.values(defaultResolvers).forEach(this.#R.use.bind(this.#R))
  }

  get actions() {
    return this.#R.get('nui').getActions() as {
      [K in ActionType]: Store.ActionObject[]
    }
  }

  get builtIns() {
    return this.#R.get('nui').getBuiltIns() as {
      [funcName: string]: Store.BuiltInObject[]
    }
  }

  /**
   * Takes a list of raw NOODL components, converts to DOM nodes and appends to the DOM
   * @param { ComponentObject | ComponentObject[] } components
   */
  render(rawComponents: ComponentObject | ComponentObject[]) {
    const currentPage = this.page.state.current
    this.page.reset('render')

    if (this.page.rootNode && this.page.rootNode.id === currentPage) {
      return console.log(
        `%cSkipped rendering the DOM for page "${currentPage}" because the DOM ` +
          `nodes are already rendered`,
        `color:#ec0000;font-weight:bold;`,
        this.page.snapshot(),
      )
    }
    // Create the root node where we will be placing DOM nodes inside.
    // The root node is a direct child of document.body
    this.page.setStatus(eventId.page.status.RESOLVING_COMPONENTS)

    const resolved = this.#R.get('nui')?.resolveComponents(rawComponents)

    this.page.setStatus(eventId.page.status.COMPONENTS_RECEIVED)

    const components = u.isArr(resolved) ? resolved : [resolved]

    this.page.emitSync(eventId.page.on.ON_DOM_CLEANUP, this.page.rootNode)

    this.page.clearRootNode()

    this.page.setStatus(eventId.page.status.RENDERING_COMPONENTS)

    components.forEach((component) => this.draw(component, this.page.rootNode))

    this.page.setStatus(eventId.page.status.COMPONENTS_RENDERED)

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
  ) {
    let node: T.NOODLDOMElement | null = null

    if (component) {
      if (isPluginComponent(component)) {
        // We will delegate the role of the node creation to the consumer
        const getNode = (elem: HTMLElement) => (node = elem)
        this.#R.run(getNode, component)
        return node
      } else if (Identify.component.image(component)) {
        node = isEmitObj((component as any).get('path'))
          ? createAsyncImageElement(
              (container || document.body) as HTMLElement,
              {},
            )
          : document.createElement('img')
      } else {
        node = document.createElement(getTagName(component))
      }

      if (node) {
        const parent = container || document.body
        parent.appendChild(node)

        this.#R.run(node, component)

        component.children?.forEach?.((child: Component) => {
          const childNode = this.draw(child, node) as HTMLElement
          this.page.emitSync(
            eventId.page.on.ON_BEFORE_APPEND_COMPONENT_CHILD_NODE,
            {
              page: this.page,
              component,
              node: node as HTMLElement,
              child,
              childNode,
            },
          )
          node?.appendChild(childNode)
        })

        this.page.emitSync(eventId.page.on.ON_CHILD_NODES_RENDERED, {
          blueprint: component.original,
          component,
          node,
          page: this.page,
        })
      }
    }
    return node || null
  }

  redraw(
    node: T.NOODLDOMElement | null, // ex: li (dom node)
    component: Component, // ex: listItem (component instance)
    args: { dataObject?: any; resolveComponents?: any } = {},
  ) {
    let newNode: T.NOODLDOMElement | null = null
    let newComponent: Component | undefined
    let { dataObject } = args

    if (component) {
      const parent = component.parent
      const shape = getShape(component)
      const _isPageConsumer = isPageConsumer(component)

      // Clean up noodl-ui listeners
      component.clear()

      // if (parent?.type === 'list') {
      // dataObject && parent.removeDataObject(dataObject)
      // }
      // Remove the parent reference
      component.setParent?.(null)
      this.page.emitSync(
        eventId.page.on.ON_REDRAW_BEFORE_CLEANUP,
        node,
        component,
      )
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
          console.info(c)
        }
      })
      // Create the new component
      newComponent = createComponent(shape)
      if (dataObject && newComponent?.type === 'listItem') {
        // Set the original dataObject on the new component instance if available
        ;(newComponent as any).setDataObject?.(dataObject)
      }
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

        resolveComponents = NUI.resolveComponents.bind(NUI)
      }
      if (!resolveComponents) resolveComponents = args?.resolveComponents
      if (!resolveComponents) {
        const noodlui = this.#R.get('nui')
        resolveComponents = noodlui.resolveComponents?.bind?.(noodlui)
      }
      newComponent = resolveComponents?.(newComponent) || newComponent
    }

    if (node) {
      const parentNode = node.parentNode
      if (newComponent) {
        newNode = this.draw(
          newComponent,
          (parentNode || document.body) as T.NOODLDOMElement,
        )
      }

      if (parentNode) {
        if (parentNode.contains(node) && newNode) {
          parentNode.replaceChild(newNode as T.NOODLDOMElement, node)
        } else if (newNode) {
          parentNode.insertBefore(
            newNode as T.NOODLDOMElement,
            parentNode.childNodes[0],
          )
        }
      }
    } else if (component) {
      // Some components like "plugin" can have a null as their node, but their
      // component is still running
      this.draw(newComponent as Component)
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
      this.#R.get('nui').use(obj)
    }
    return this
  }

  resolvers() {
    return this.#R.get()
  }

  reset(key?: 'resolvers') {
    if (key) this.resolvers().length = 0
    else this.#R.clear()
    return this
  }

  use(obj: typeof NUI) {
    if (typeof obj?.resolveComponents === 'function') {
      this.#R.use(obj)
      this.page.viewport = obj.getRootPage().viewport
    }
    return this
  }
}

export default NOODLOM
