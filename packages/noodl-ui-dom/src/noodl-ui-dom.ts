import Logger from 'logsnap'
import {
  getType,
  IComponentTypeInstance,
  NOODLComponentType,
  IfObject,
  IList,
} from 'noodl-ui'
import { evalIf, isBoolean as isNOODLBoolean, isBooleanTrue } from 'noodl-utils'
import {
  componentEventMap,
  componentEventIds,
  componentEventTypes,
} from './constants'
import * as T from './types'
import { get } from './utils'

const log = Logger.create('noodl-ui-dom')

class NOODLUIDOM implements T.INOODLUiDOM {
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
  #cache: Map<
    string,
    { node: Element | null; component: IComponentTypeInstance }
  >
  #stub: { elements: { [key: string]: T.NOODLDOMElement } } = { elements: {} }

  constructor({ log }: { log?: { enabled?: boolean } } = {}) {
    Logger[log?.enabled ? 'enable' : 'disable']?.()
    this.#cache = new Map()
  }

  /**
   * Parses props and returns a DOM Node described by props. This also
   * resolves its children hieararchy until there are none left
   * @param { IComponentTypeInstance } props
   */
  parse<C extends IComponentTypeInstance>(
    component: C,
    container?: T.NOODLDOMElement | null,
  ) {
    const { noodlType } = component || {}
    let node: T.NOODLDOMElement | null = null

    if (component) {
      if (noodlType === 'plugin') {
        // Don't create a node. Except just emit the events accordingly
        // This is to allow the caller to determine whether they want to create
        // a separate DOM node or not
        this.emit('create.component', null, component)
        this.emit('create.plugin', null, component)
      } else {
        node = document.createElement(getType(component))
        this.emit('create.component', node, component)

        if (node) {
          if (component?.noodlType === 'list') {
            // noodl-ui delegates the responsibility for us to decide how
            // to control how list children are first rendered to the DOM
            const listComponent = component as IList
            const listObject = listComponent.getData()
            const numDataObjects = listObject?.length || 0

            if (numDataObjects) {
              listComponent.set('listObject', [])
              for (let index = 0; index < numDataObjects; index++) {
                const dataObject = listObject[index]
                if (dataObject) {
                  // This emits the "create list item" event that we should already have a listener for
                  listComponent.addDataObject(dataObject)
                }
              }
            }
          }

          if (componentEventMap[noodlType as NOODLComponentType]) {
            this.emit(componentEventMap[noodlType], node, component)
          }

          // this.#cache.set(component.id, {
          //   node,
          //   component,
          // })

          const parent = container || document.body
          if (!parent.contains(node)) parent.appendChild(node)

          if (component.length) {
            component.children().forEach((child: IComponentTypeInstance) => {
              const childNode = this.parse(child, node) as Element
              // this.#cache.set(child.id, {
              //   node: childNode,
              //   child,
              // })
              node?.appendChild(childNode)
            })
          }
        }
      }
    }

    return node || null
  }

  /**
   * Registers a listener to the listeners list
   * @param { string } eventName - Name of the listener event
   * @param { function } callback - Callback to invoke when the event is emitted
   */
  on<CT extends NOODLComponentType>(
    eventName: T.NOODLDOMEvent,
    callback: (
      node: T.NOODLDOMElement | null,
      component: IComponentTypeInstance<CT>,
    ) => void,
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
  off<E extends T.NOODLDOMEvent>(
    eventName: E,
    callback: Parameters<T.INOODLUiDOM['off']>[1],
  ) {
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
    component: IComponentTypeInstance,
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
  getCallbacks(eventName: T.NOODLDOMEvent): Function[] | null {
    if (typeof eventName === 'string') {
      const callbacksMap = this.#callbacks
      if (eventName === 'create.component') return callbacksMap.all
      if (componentEventIds.includes(eventName)) {
        return callbacksMap.component[this.#getEventKey(eventName)]
      }
    }
    return null
  }

  redraw(
    node: Element | null,
    component: IComponentTypeInstance,
    actionObj: any,
  ) {
    // console.info('TOMATO', { node, component: component.toJS(), actionObj })

    const resolvePath = (
      node: any,
      path: IfObject,
      c: IComponentTypeInstance,
    ) => {
      // console.info(path)
      let src: any

      const cache = this.#cache.get(c.id) || this.#cache.get(node.id)

      console.info('resolvePath', {
        component: c.toJS(),
        cachedComponent: cache?.component,
        componentDataObject: c?.getDataObject?.(),
        cacheDataObject: cache?.component?.getDataObject?.(),
        node,
        cachedNode: cache?.node,
        path,
        actionObj,
      })

      if (path && typeof path === 'object' && 'if' in path) {
        src = evalIf((val, valOnTrue, valOnFalse) => {
          if (isNOODLBoolean(val)) {
            return isBooleanTrue(val)
          } else if (typeof val === 'function') {
            console.info('')
            console.info('---------------------------------------------')
            console.info('           dataObject', c?.getDataObject?.())
            console.info('---------------------------------------------')
            console.info('')
            return val(c.getDataObject())
          } else {
            return !!val
          }
        }, path)
      } else {
        src = path
      }
      if (node) node.querySelector('img').src = src
    }

    if (component.get('path'))
      resolvePath(node, component.get('path'), component)

    component.broadcast((child) => {
      const { path } = component.get(['path'])
      let dataKey = child.get('dataKey') || ''

      if (dataKey.startsWith(child.iteratorVar)) {
        if (child.type === 'label') {
          const labelNode = document.querySelector(`[data-key="${dataKey}"]`)
          if (labelNode) {
            dataKey = dataKey.split('.').slice(1).join('.')
            let dataValue = get(child.getDataObject(), dataKey)
            if (dataValue) labelNode.textContent = dataValue
          }
        } else if (child.type === 'input') {
          log.func('create.list.item [redraw] REMINDER -- implement this')
        }
      } else {
        // const n = document.querySelector(`[data-key="${dataKey}"]`)
        // if (n) n.textContent = _.get(component.getDataObject(), dataKey)
      }
      // if (child.type === 'img') {
      // noodlui.resolveComponents(child)
      const childNode = document?.querySelector(
        `[data-viewtag="${child.get('viewTag')}"]`,
      )
      // this.emit('create.component', childNode, child)
      // this.emit('create.image', childNode, child)
      if (path) resolvePath(childNode, path, child)
      // console.info('START TEST')
      // console.info(childNode)
      // console.info('END TEST')
      // }
    })
  }

  observe(node: Element, component: IComponentTypeInstance) {
    const observer = new MutationObserver((mutations) => {
      log.func('observe')
      log.gold(`Observing changes to a ${component.noodlType}`, {
        component,
        node,
        mutations,
      })
    })
    return observer
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
    if (eventName === 'create.component') return 'all'
    const fn = (type: string) => componentEventMap[type] === eventName
    eventKey = componentEventTypes.find(fn)
    return eventKey || ''
  }
}

export default NOODLUIDOM
