import { ActionType } from 'noodl-types'
import {
  ActionObject,
  BuiltInObject,
  ComponentInstance,
  createComponent,
  EmitActionObject,
  findParent,
  getTagName,
  GotoActionObject,
  NOODL as NOODLUI,
  NOODLComponent,
  Page as PageComponent,
  publish,
  StoreActionObject,
  StoreBuiltInObject,
  ToastActionObject,
} from 'noodl-ui'
import { isEmitObj, isPluginComponent } from 'noodl-utils'
import { eventId } from './constants'
import { createAsyncImageElement, getShape, isPageConsumer } from './utils'
import createResolver from './createResolver'
import NOODLUIDOMInternal from './Internal'
import Page from './Page'
import * as defaultResolvers from './resolvers'
import * as T from './types'

class NOODLUIDOM extends NOODLUIDOMInternal {
  #R: ReturnType<typeof createResolver>
  #cbs = {
    page: {
      on: {
        [eventId.page.on.ON_DOM_CLEANUP]: [] as (() => void)[],
      },
    },
    redraw: {
      cleanup: [] as ((...args: Parameters<NOODLUIDOM['redraw']>) => void)[],
    },
  }
  page: Page

  constructor() {
    super()
    this.page = new Page(this.render.bind(this))
    this.#R = createResolver()
    this.#R.use(this)
    this.#R.use(Object.values(defaultResolvers))
  }

  get actions() {
    return this.#R.get('noodlui').getCbs('actions') as {
      [K in ActionType]: StoreActionObject<any, T.ActionChainDOMContext>[]
    }
  }

  get builtIns() {
    return this.#R.get('noodlui').getCbs('builtIns') as {
      [funcName: string]: StoreBuiltInObject<any, T.ActionChainDOMContext>[]
    }
  }

  get callbacks() {
    return this.#cbs
  }

  /**
   * Takes a list of raw NOODL components, converts to DOM nodes and appends to the DOM
   * @param { NOODLComponent | NOODLComponent[] } components
   */
  render(rawComponents: NOODLComponent | NOODLComponent[]) {
    const currentPage = this.page.getState().current
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
    const resolved = this.#R.get('noodlui')?.resolveComponents(rawComponents)
    this.page.setStatus(eventId.page.status.COMPONENTS_RECEIVED)
    const components = Array.isArray(resolved) ? resolved : [resolved]
    this.#emit(eventId.page.on.ON_DOM_CLEANUP)
    this.page.rootNode.innerHTML = ''
    this.page.setStatus(eventId.page.status.RENDERING_COMPONENTS)
    components.forEach((component) => {
      this.draw(component, this.page.rootNode)
    })
    this.page.setStatus(eventId.page.status.COMPONENTS_RENDERED)
    return components
  }

  /**
   * Parses props and returns a DOM Node described by props. This also
   * resolves its children hieararchy until there are none left
   * @param { ComponentInstance } props
   */
  draw<C extends ComponentInstance = any>(
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
      } else if (component.noodlType === 'image') {
        node = isEmitObj((component as any).get('path'))
          ? createAsyncImageElement(
              (container || document.body) as HTMLElement,
              {},
            )
          : document.createElement('img')
        this.#R.run(node, component)
      } else {
        node = document.createElement(
          getTagName(component as ComponentInstance),
        )
        this.#R.run(node, component)
      }
      if (node) {
        let parent = container || document.body

        parent.appendChild(node)

        if (component.length) {
          component.children().forEach((child: ComponentInstance) => {
            const childNode = this.draw(child, node) as T.NOODLDOMElement
            node?.appendChild(childNode)
          })
        }
      }
    }
    return node || null
  }

  redraw(
    node: T.NOODLDOMElement | null, // ex: li (dom node)
    component: ComponentInstance, // ex: listItem (component instance)
    args: { dataObject?: any; resolveComponents?: any } = {},
  ) {
    let newNode: T.NOODLDOMElement | null = null
    let newComponent: ComponentInstance | undefined
    let { dataObject } = args

    if (component) {
      const parent = component.parent?.()
      const shape = getShape(component)
      const _isPageConsumer = isPageConsumer(component)

      // Clean up noodl-ui listeners
      component.clearCbs?.()

      // if (parent?.noodlType === 'list') {
      // dataObject && parent.removeDataObject(dataObject)
      // }
      // Remove the parent reference
      component.setParent?.(null)
      this.#emit(eventId.redraw.ON_BEFORE_CLEANUP, node, component, args)
      // Deeply walk down the tree hierarchy
      publish(component, (c) => {
        if (c) {
          const cParent = c.parent?.()
          // Remove listeners
          c.clearCbs()
          // Remove child component references
          cParent?.removeChild?.(c)
          // Remove the child's parent reference
          c.setParent?.(null)
        }
      })
      // Create the new component
      newComponent = createComponent(shape)
      if (dataObject && newComponent?.noodlType === 'listItem') {
        // Set the original dataObject on the new component instance if available
        ;(newComponent as any).setDataObject?.(dataObject)
      }
      let resolveComponents: NOODLUI['resolveComponents'] | undefined
      if (parent && newComponent) {
        // Set the original parent on the new component
        newComponent.setParent(parent)
        // Remove the child reference from the parent
        parent?.removeChild?.(component)
        // Set the new component as a child on the parent
        parent.createChild(newComponent)
      }
      if (_isPageConsumer) {
        const page = findParent(
          component,
          (p) => p?.noodlType === 'page',
        ) as PageComponent

        resolveComponents = page?.resolveComponents?.bind?.(page)
      }
      if (!resolveComponents) resolveComponents = args?.resolveComponents
      if (!resolveComponents) {
        const noodlui = this.#R.get('noodlui')
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
      this.draw(newComponent as ComponentInstance)
    }

    return [newNode, newComponent] as [typeof node, typeof component]
  }

  #emit = (event: Parameters<NOODLUIDOM['on']>[0], ...args: any[]) => {
    if (event === eventId.redraw.ON_BEFORE_CLEANUP) {
      this.#cbs.redraw.cleanup.forEach((cb) => {
        cb(...(args as Parameters<NOODLUIDOM['redraw']>))
      })
    } else if (event === eventId.page.on.ON_DOM_CLEANUP) {
      this.#cbs.page.on[eventId.page.on.ON_DOM_CLEANUP]?.forEach((cb) => cb())
    }
    return this
  }

  on(event: typeof eventId.page.on.ON_DOM_CLEANUP, fn: () => void): this
  on(
    event: typeof eventId.redraw.ON_BEFORE_CLEANUP,
    fn: (...args: Parameters<NOODLUIDOM['redraw']>) => void,
  ): this
  on(
    event:
      | typeof eventId.page.on.ON_DOM_CLEANUP
      | typeof eventId.redraw.ON_BEFORE_CLEANUP,
    fn: (...args: any[]) => void,
  ) {
    if (event === eventId.page.on.ON_DOM_CLEANUP) {
      this.#cbs.page.on[eventId.page.on.ON_DOM_CLEANUP].push(fn)
    } else if (event === eventId.redraw.ON_BEFORE_CLEANUP) {
      if (!this.#cbs.redraw.cleanup.includes(fn)) {
        this.#cbs.redraw.cleanup.push(fn)
      }
    }
    return this
  }

  off(event: typeof eventId.page.on.ON_DOM_CLEANUP, fn: any) {
    if (event === eventId.page.on.ON_DOM_CLEANUP) {
      this.#cbs.page.on[eventId.page.on.ON_DOM_CLEANUP] = this.#cbs.page.on[
        eventId.page.on.ON_DOM_CLEANUP
      ].filter((cb) => cb !== fn)
    }
    return this
  }

  register<
    A extends
      | ActionObject
      | EmitActionObject
      | GotoActionObject
      | ToastActionObject
  >(obj: StoreActionObject<A, T.ActionChainDOMContext>): this
  register<B extends BuiltInObject>(
    obj: StoreBuiltInObject<B, T.ActionChainDOMContext>,
  ): this
  register<R extends T.NodeResolverConfig>(obj: R): this
  register(
    obj:
      | T.NodeResolverConfig
      | StoreActionObject<any, T.ActionChainDOMContext>
      | StoreBuiltInObject<any, T.ActionChainDOMContext>,
  ): this {
    if ('resolve' in obj) {
      this.#R.use(obj)
    } else if ('actionType' in obj || 'funcName' in obj) {
      this.#R.get('noodlui').use(obj)
    }
    return this
  }

  resolvers() {
    return this.#R.get()
  }

  reset() {
    this.#R.clear()
    const clearCbs = (obj: any) => {
      if (Array.isArray(obj)) {
        obj.length = 0
      } else if (obj && typeof obj === 'object') {
        Object.values(obj).forEach((o) => clearCbs(o))
      }
    }
    Object.values(this.#cbs).forEach((obj) => clearCbs(obj))
    return this
  }

  use(obj: NOODLUI) {
    if (obj instanceof NOODLUI) {
      this.#R.use(obj)
    }
    return this
  }
}

export default NOODLUIDOM
