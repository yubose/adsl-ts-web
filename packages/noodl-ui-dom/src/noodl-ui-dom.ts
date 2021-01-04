import {
  createComponent,
  ComponentInstance,
  getTagName,
  NOODL as NOODLUI,
  publish,
} from 'noodl-ui'
import { isEmitObj, isPluginComponent } from 'noodl-utils'
import { eventId } from './constants'
import { createAsyncImageElement, getShape } from './utils'
import NOODLUIDOMInternal from './Internal'
import createResolver from './createResolver'
import * as defaultResolvers from './resolvers'
import * as T from './types'

class NOODLUIDOM extends NOODLUIDOMInternal {
  #R: ReturnType<typeof createResolver>
  #cbs = {
    redraw: {
      cleanup: [] as ((...args: Parameters<NOODLUIDOM['redraw']>) => void)[],
    },
  }
  config: {
    redraw: {
      resolveComponents: NOODLUI['resolveComponents'] | undefined
    }
  } = { redraw: { resolveComponents: undefined } }

  constructor() {
    super()
    this.#R = createResolver()
    this.#R.use(this)
    this.#R.use(Object.values(defaultResolvers))
  }

  get callbacks() {
    return this.#cbs
  }

  configure({
    redraw,
  }: {
    redraw?: {
      cleanup?: (...args: Parameters<NOODLUIDOM['redraw']>) => void
      resolveComponents?: NOODLUI['resolveComponents']
    }
  }) {
    if (redraw) {
      if (redraw.resolveComponents) {
        // !NOTE - opts.resolver needs to be provided as an anonymous func to preserve the "this" value
        this.config.redraw.resolveComponents = redraw.resolveComponents
      }
    }

    return this
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
        // Don't create a node. Except just emit the events accordingly
        // This is to allow the caller to determine whether they want to create
        // a separate DOM node or not
        if (component.noodlType === 'plugin') {
          this.#R.run(node, component)
          return node
        } else {
          // We will delegate the role of the node creation to the consumer
          this.#R.run((result: T.NOODLDOMElement) => (node = result), component)
        }
      } else {
        if (component.noodlType === 'image') {
          node = isEmitObj((component as any).get('path'))
            ? createAsyncImageElement(container || document.body, {})
            : document.createElement('img')
        } else {
          node = document.createElement(
            getTagName(component as ComponentInstance),
          )
        }
        this.#R.run(node, component)
        if (node) {
          const parent = container || document.body
          if (!parent.contains(node)) parent.appendChild(node)
          if (component.length) {
            component.children().forEach((child: ComponentInstance) => {
              const childNode = this.draw(child, node) as T.NOODLDOMElement
              node?.appendChild(childNode)
            })
          }
        }
      }
    }

    return node || null
  }

  redraw(
    node: T.NOODLDOMElement | null, // ex: li (dom node)
    component: ComponentInstance, // ex: listItem (component instance)
    args: { dataObject?: any } = {},
  ) {
    let newNode: T.NOODLDOMElement | null = null
    let newComponent: ComponentInstance | undefined
    let { dataObject } = args

    if (component) {
      const parent = component.parent?.()
      const shape = getShape(component)

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
      if (parent && newComponent) {
        // Set the original parent on the new component
        newComponent.setParent(parent)
        // Remove the child reference from the parent
        parent?.removeChild?.(component)
        // Set the new component as a child on the parent
        parent.createChild(newComponent)
        // Run the resolver if provided
        newComponent =
          this.config.redraw.resolveComponents?.(newComponent) || newComponent
      } else if (newComponent) {
        // log --> !parent || !newComponent
        newComponent =
          this.config.redraw.resolveComponents?.(newComponent) || newComponent
      }
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
    }
    return this
  }

  on(
    event: typeof eventId.redraw.ON_BEFORE_CLEANUP,
    fn: (...args: Parameters<NOODLUIDOM['redraw']>) => void,
  ) {
    if (event === eventId.redraw.ON_BEFORE_CLEANUP) {
      if (!this.#cbs.redraw.cleanup.includes(fn)) {
        this.#cbs.redraw.cleanup.push(fn)
      }
    }
    return this
  }

  register(obj: NOODLUI | T.NodeResolverConfig): this {
    this.#R.use(obj)
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
}

export default NOODLUIDOM
