import find from 'lodash/find'
import Logger from 'logsnap'
import { ComponentObject, StyleObject } from 'noodl-types'
import { LiteralUnion } from 'type-fest'
import { getRandomKey } from '../utils/common'
import * as u from '../utils/internal'
import * as T from '../types'

const log = Logger.create('Base')

class Component<C extends ComponentObject = ComponentObject>
  implements T.IComponent<C> {
  #cache: { [key: string]: any } = {}
  #cb: { [eventName: string]: ((...args: any[]) => any)[] } = {}
  #cbIds: string[] = []
  #component: ComponentObject
  #children: T.ComponentInstance[] = []
  #id: string = ''
  #type: C['type']
  #parent: T.ComponentInstance | null = null
  blueprint: C

  static isComponent(value: unknown): value is Component {
    return !!value && value instanceof Component
  }

  [Symbol.iterator]() {
    const entries = Object.entries(this.#component)
    return {
      next() {
        return {
          done: !entries.length,
          value: entries.pop() || [],
        }
      },
    }
  }

  constructor(component: C) {
    this.blueprint = Component.isComponent(component)
      ? (component.blueprint as C)
      : component
    this.#component = { ...this.blueprint, style: { ...this.blueprint?.style } }
    this.#id = this.#component.id || getRandomKey()
    this.#type = this.blueprint?.type
  }

  get id() {
    return this.#id
  }

  get children() {
    return this.#children
  }

  get contentType() {
    return this.blueprint?.contentType
  }

  get length() {
    return this.#children.length || 0
  }

  get parent() {
    return this.#parent
  }

  get type() {
    return this.#type
  }

  get style() {
    return this.#component.style as StyleObject
  }

  set style(style: StyleObject) {
    this.#component.style = style || {}
  }

  edit(fn: (props: ComponentObject) => ComponentObject | undefined | void): void
  edit(prop: Record<string, any>): void
  edit(prop: string, value: any): void
  edit(
    fn:
      | Record<string, any>
      | string
      | ((props: ComponentObject) => ComponentObject | undefined | void),
    value?: any,
  ) {
    if (u.isFnc(fn)) {
      const props = fn(this.#component)
      if (u.isObj(props)) {
        Object.entries(props).forEach(([k, v]) => {
          if (k === 'style') {
            if (!this.style) this.style = {}
            u.isObj(v) && u.assign(this.style, v)
          } else {
            this.#component[k] = v
          }
        })
      }
    } else if (u.isStr(fn)) {
      this.#component[fn] = value
    } else if (u.isObj(fn)) {
      Object.entries(fn).forEach(([k, v]) => {
        if (k === 'style') {
          if (u.isObj(v)) u.assign(this.style, v)
          else this.style = v
        } else {
          // if (k === 'data-value') debugger
          this.#component[k] = v
        }
      })
    }
  }

  get<K extends LiteralUnion<keyof ComponentObject, string>>(
    key: string,
  ): ComponentObject[K]
  get(): C
  get<K extends LiteralUnion<keyof ComponentObject, string>>(key?: K) {
    if (key) return this.#component[key]
    return this.#component
  }

  /**
   * Returns the value of the component property using key, or
   * Returns the value of the property of the component's style object
   * using styleKey if key === 'style'
   * @param { string } key - Component property or "style" if using styleKey for style lookups
   */
  props() {
    return {
      ...this.#component,
      id: this.#id,
    } as ComponentObject & { id: string }
  }

  /**
   * Returns true if the key exists on the blueprint
   * NOTE: It is very important to remember that this method only cares about
   * the blueprint!
   * @param { string } key - Component property or "style" if using styleKey for style lookups
   */
  has<K extends keyof ComponentObject>(key: K) {
    return key in (this.blueprint || {})
  }

  /**
   * Removes a component property, or removes a style property from the style object
   * using styleKey if key === 'style'
   * @param { string } key - Component property, or "style" if removing a style property using styleKey
   */
  remove<K extends LiteralUnion<keyof ComponentObject, string>>(key: K) {
    if (key === 'style') this.#component.style = {}
    else delete this.#component[key]
    return this
  }

  /* -------------------------------------------------------
  ---- Syntax sugar for working with styles
-------------------------------------------------------- */

  /**
   * Returns the most recent
   * component object at the time of this call.
   * If it is still a draft it is converted into plain JS
   */
  snapshot() {
    return {
      ...this.toJSON(),
      _cache: this.#cache,
    }
  }

  /** Returns the JS representation of the currently resolved component */
  toJSON() {
    const result = {} as ReturnType<T.IComponent['toJSON']>
    u.assign(result, this.props(), {
      parentId: this.parent?.id || null,
      children: this.children.map((child) => child?.toJSON?.()),
    })
    return result
  }

  /**
   * Returns a stringified JSON object of the current component
   * @param { number | undefined } spaces - Spaces to indent in the JSON string
   */
  toString({ spaces = 2 }: { spaces?: number } = {}) {
    return JSON.stringify(this.toJSON(), null, spaces)
  }

  setParent(parent: T.ComponentInstance | null) {
    this.#parent = parent
    return this
  }

  /**
   * Returns a child at the index. Returns null if nothing was found.
   * If an index is not passed in it will default to returning the
   * first child or null otherwise
   * @param { number } index
   */
  child(index?: number) {
    if (!arguments.length) return this.#children?.[0]
    return this.#children?.[index as number]
  }

  /**
   * Creates and appends the new child instance to the childrens list
   * @param { IComponentType } props
   */
  createChild<C extends T.ComponentInstance>(child: C): C {
    child?.setParent?.(this)
    !this.#children.includes(child) && this.#children.push(child)
    return child
  }

  /**
   * Removes a child from its children. You can pass in either the instance
   * directly, the index leading to the child, the component's id, or leave the args empty to
   * remove the first child by default
   * @param { T.ComponentInstance | string | number | undefined } child - Child component, id, index, or no arg (to remove the first child by default)
   */
  removeChild(index: number): T.ComponentInstance | undefined
  removeChild(id: string): T.ComponentInstance | undefined
  removeChild(child: T.ComponentInstance): T.ComponentInstance | undefined
  removeChild(): T.ComponentInstance | undefined
  removeChild(child?: T.ComponentInstance | number | string) {
    let removedChild: T.ComponentInstance | undefined
    if (!arguments.length) {
      removedChild = this.#children.shift()
    } else if (typeof child === 'number' && this.#children[child]) {
      removedChild = this.#children.splice(child, 1)[0]
    } else if (typeof child === 'string') {
      removedChild = child
        ? find(this.#children, (c) => c.id === child)
        : undefined
    } else if (this.#children.includes(child as T.ComponentInstance)) {
      if (this.#children.includes(child as T.ComponentInstance)) {
        this.#children = this.#children.filter((c) => {
          if (c === child) {
            removedChild = child
            return false
          }
          return true
        })
      }
    }
    return removedChild
  }

  on(eventName: string, cb: (...args: any[]) => any, id: string = '') {
    // log.func('on')
    // log.cyan(`Component listening on: ${eventName}`, {
    //   args: arguments,
    //   component: this,
    // })
    if (id) {
      if (!this.#cbIds.includes(id)) this.#cbIds.push(id)
      else return this
    }
    if (!u.isArr(this.#cb[eventName])) this.#cb[eventName] = []
    this.#cb[eventName].push(cb)
    return this
  }

  off(eventName: any, cb: (...args: any[]) => any) {
    if (u.isArr(this.#cb[eventName])) {
      if (this.#cb[eventName].includes(cb)) {
        log.func(`off [${this.type}]`)
        log.grey(`Removing "${eventName}"`, this)
        this.#cb[eventName].splice(this.#cb[eventName].indexOf(cb), 1)
      }
    }
    return this
  }

  emit(eventName: string, ...args: any[]) {
    // log.func('emit')
    // log.cyan(`Component emit: ${eventName}`, {
    //   args,
    //   component: this,
    //   eventName,
    // })
    this.#cb[eventName]?.forEach((fn) => fn(...args))
    return this
  }

  getCbs() {
    return this.#cb
  }

  clearCbs() {
    Object.keys(this.#cb).forEach((eventName) => {
      if (u.isArr(this.#cb[eventName])) {
        this.#cb[eventName].length = 0
      }
    })
    return this
  }

  clearChildren() {
    if (u.isArr(this.#children)) {
      this.#children.length = 0
    }
  }
}

export default Component
