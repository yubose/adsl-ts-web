import {
  createComponent,
  Component,
  ComponentObject,
  getTagName,
  ListItem,
  NOODL as NOODLUI,
  publish,
} from 'noodl-ui'
import { isEmitObj, isPluginComponent } from 'noodl-utils'
import { createAsyncImageElement, getShape } from './utils'
import {
  componentEventMap,
  componentEventIds,
  componentEventTypes,
} from './constants'
import createResolver from './createResolver'
import * as defaultResolvers from './resolvers'
import * as T from './types'

class NOODLUIDOM {
  #callbacks: {
    all: Function[]
    component: Record<T.NOODLDOMComponentType, Function[]>
  } = {
    all: [],
    component: componentEventTypes.reduce(
      (acc, evt: T.NOODLDOMComponentType) => Object.assign(acc, { [evt]: [] }),
      {} as Record<T.NOODLDOMComponentType, Function[]>,
    ),
  }
  #stub: { elements: { [key: string]: T.NOODLDOMElement } } = { elements: {} }
  #R: ReturnType<typeof createResolver>

  constructor() {
    this.#R = createResolver()
    this.#R.use(Object.values(defaultResolvers))
  }

  /**
   * Parses props and returns a DOM Node described by props. This also
   * resolves its children hieararchy until there are none left
   * @param { Component } props
   */
  parse<C extends Component>(
    component: C,
    container?: T.NOODLDOMElement | null,
  ) {
    let node: T.NOODLDOMElement | null = null

    const { noodlType } = component || ({} as Component)

    if (component) {
      if (isPluginComponent(component)) {
        // Don't create a node. Except just emit the events accordingly
        // This is to allow the caller to determine whether they want to create
        // a separate DOM node or not
        if (component.noodlType === 'plugin') {
          this.#R.run(node, component)
          // this.emit('component', null, component)
          // this.emit('plugin', null, component)
          return node
        } else {
          const plugin = component.get('plugin')
          let src = component.get('src') || ''
          if (plugin) {
            const mimeType = src.endsWith?.('.html')
              ? 'text/html'
              : src.endsWith?.('.js')
              ? 'text/javascript'
              : 'text/html'
            if (mimeType === 'text/javascript') {
              node = document.createElement('script')
              ;(node as HTMLScriptElement).type = 'text/javascript'
              node.onload = () => {
                if (plugin.location === 'head') {
                  document.head.appendChild(node as any)
                } else if (plugin.location === 'body-top') {
                  document.body.insertBefore(
                    node as any,
                    document.body.childNodes[0],
                  )
                } else if (plugin.location === 'body-bottom') {
                  document.body.appendChild(node as any)
                }
              }
              component.on('path', (newSrc: string) => {
                src = newSrc
                node && ((node as HTMLImageElement).src = src)
              })
              // The behavior for these specific components will take on the shape of
              // a <script> DOM node, since the fetched contents from their url comes within
              // the component instance themselves
              return node
            }
          }
        }
      } else {
        if (component.noodlType === 'image') {
          component.on('path', (result: string) => {
            node && ((node as HTMLImageElement).src = result)
          })
          node = isEmitObj(component.get('path'))
            ? createAsyncImageElement(container || document.body, {})
            : document.createElement('img')
        } else {
          node = document.createElement(getTagName(component))
        }

        if (node) {
          if (component?.noodlType === 'list') {
            // noodl-ui delegates the responsibility for us to decide how
            // to control how list children are first rendered to the DOM
            const listComponent = component as any
            const listObject = listComponent.getData()
            const numDataObjects = listObject?.length || 0
            if (numDataObjects) {
              listComponent.children().forEach((c: ListItem) => {
                c?.setDataObject?.(null)
                listComponent.removeDataObject(0)
              })
              listComponent.set('listObject', [])
              // Remove the placeholders
              for (let index = 0; index < numDataObjects; index++) {
                // This emits the "create list item" event that we should already have a listener for
                listComponent.addDataObject(listObject[index])
              }
            }
          }
          // this.emit('component', node, component)

          // if (componentEventMap[noodlType as ComponentType]) {
          //   this.emit(componentEventMap[noodlType], node, component)
          // }
          this.#R.run(node, component)
          const parent = container || document.body
          if (!parent.contains(node)) parent.appendChild(node)
          if (component.length) {
            component.children().forEach((child: Component) => {
              const childNode = this.parse(child, node) as HTMLElement
              node?.appendChild(childNode)
            })
          }
        }
      }
    }

    return node || null
  }

  redraw(
    node: HTMLElement | null, // ex: li (dom node)
    component: Component, // ex: listItem (component instance)
    {
      dataObject,
      ...opts
    }: {
      dataObject?: any
      resolver?: (
        noodlComponent: ComponentObject | ComponentObject[],
      ) => Component
    } = {},
  ) {
    if (!opts?.resolver) {
      console.error(
        `%cNo resolver was provided for redraw. The DOM nodes will be empty`,
        { node, component, ...opts },
      )
    }

    let newNode: HTMLElement | null = null
    let newComponent: Component | undefined

    if (component) {
      const parent = component.parent?.()
      const shape = getShape(component)

      // Clean up noodl-ui listeners
      component.clearCbs?.()

      if (parent?.noodlType === 'list') {
        dataObject && parent.removeDataObject(dataObject)
      }
      // Remove the parent reference
      component.setParent?.(null)
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
        // !NOTE - opts.resolver needs to be provided as an anonymous func to preserve the "this" value
        newComponent = opts?.resolver?.(newComponent as any) || newComponent
      } else if (newComponent) {
        // log --> !parent || !newComponent
        newComponent = opts?.resolver?.(newComponent as any) || newComponent
      }
    }

    if (node) {
      const parentNode = node.parentNode
      if (newComponent) {
        newNode = this.parse(
          newComponent,
          (parentNode || document.body) as HTMLElement,
        )
      }

      if (parentNode) {
        if (parentNode.contains(node) && newNode) {
          parentNode.replaceChild(newNode as HTMLElement, node)
        } else if (newNode) {
          parentNode.insertBefore(
            newNode as HTMLElement,
            parentNode.childNodes[0],
          )
        }
      }
    } else if (component) {
      // Some components like "plugin" can have a null as their node, but their
      // component is still running
      this.parse(newComponent as Component)
    }

    return [newNode, newComponent] as [typeof node, typeof component]
  }

  /**
   * Registers a listener to the listeners list
   * @param { string } eventName - Name of the listener event
   * @param { function } callback - Callback to invoke when the event is emitted
   */
  on(
    eventName: T.NOODLDOMEvent,
    callback: (node: T.NOODLDOMElement | null, component: Component) => void,
  ) {
    const callbacks = this.getCallbacks(eventName)
    if (Array.isArray(callbacks)) callbacks.push(callback)
    return this
  }

  /**
   * Removes a listener's callback from the listeners list
   * @param { string } eventName - Name of the listener event
   * @param { function } callback
   */
  off<E extends T.NOODLDOMEvent>(eventName: E, callback: Function) {
    const callbacks = this.getCallbacks(eventName)
    if (Array.isArray(callbacks)) {
      const index = callbacks.indexOf(callback)
      if (index !== -1) callbacks.splice(index, 1)
    }
    return this
  }

  /**
   * Emits an event name and calls all the callbacks registered to that event
   * @param { string } eventName - Name of the listener event
   * @param { ...any[] } args
   */
  emit<E extends string = T.NOODLDOMEvent>(
    eventName: E,
    node: T.NOODLDOMElement | null,
    component: Component,
  ) {
    const callbacks = this.getCallbacks(eventName as T.NOODLDOMEvent)
    if (Array.isArray(callbacks)) {
      callbacks.forEach((fn) => fn && fn(node as T.NOODLDOMElement, component))
    }
    return this
  }

  /**
   * Takes either a component type or any other name of an event and returns the
   * callbacks associated with it
   * @param { string } value - Component type or name of the event
   */
  getCallbacks(eventName?: T.NOODLDOMEvent) {
    if (!arguments.length) return this.#callbacks
    if (typeof eventName === 'string') {
      const callbacksMap = this.#callbacks
      if (eventName === 'component') return callbacksMap.all
      if (componentEventIds.includes(eventName)) {
        return callbacksMap.component[this.#getEventKey(eventName)]
      } else if (eventName) {
        if (!callbacksMap[eventName]) callbacksMap[eventName] = []
        return callbacksMap[eventName]
      }
    }
    return null
  }

  /**
   * Returns true if key can exist as a property or method on a DOM node of tagName
   * @param { string } tagName - HTML tag
   * @param { string } key - Property of a DOM node
   */
  isValidAttr(tagName: T.NOODLDOMElementTypes, key: string) {
    if (key && tagName) {
      if (!this.#stub.elements[tagName]) {
        this.#stub.elements[tagName] = document.createElement(tagName)
      }
      return key in this.#stub.elements[tagName]
    }
    return false
  }

  /**
   * Takes an event name like "on.create" and returns the direct parent key
   * @param { string } eventName - Name of an event
   */
  #getEventKey = (eventName: T.NOODLDOMEvent) => {
    // TODO - Add more cases
    let eventKey: string | undefined
    if (eventName === 'component') return 'all'
    const fn = (type: string) => componentEventMap[type] === eventName
    eventKey = componentEventTypes.find(fn)
    return eventKey || ''
  }

  getAllCbs() {
    return this.#callbacks
  }

  removeCbs(key: string) {
    if (this.#callbacks.component[key]) {
      this.#callbacks.component[key].length = 0
    }
    if (key === 'all') this.#callbacks.all.length = 0
    return this
  }

  reset() {
    this.#callbacks.all.length = 0
    Object.keys(this.#callbacks.component).forEach((key) => {
      this.#callbacks.component[key].length = 0
    })
    return this
  }

  register(obj: T.NodeResolverConfig): this
  register(obj: NOODLUI): this
  register(obj: NOODLUI | T.NodeResolverConfig) {
    this.#R.use(obj)
    return this
  }

  resolvers() {
    return this.#R.get()
  }
}

export default NOODLUIDOM
