import isPlainObject from 'lodash/isPlainObject'
import find from 'lodash/find'
import Logger from 'logsnap'
import { WritableDraft } from 'immer/dist/internal'
import { isDraft, original, current } from 'immer'
import { ComponentObject, StyleObject, userEvent } from 'noodl-types'
import createComponentDraftSafely from '../utils/createComponentDraftSafely'
import * as u from '../utils/internal'
import * as T from '../types'

const log = Logger.create('Base')

interface EditResolutionOptions {
  remove?: string | string[] | Record<string, () => boolean>
}

// Current component events: 'path' attached by createSrcf

class Component<C extends ComponentObject = ComponentObject>
  implements T.IComponent<C> {
  #blueprint: ComponentObject
  // This cache is used internally to cache original objects (ex: action objects)
  #cache: { [key: string]: any }
  #hooks: Partial<
    Record<T.Component.HookEvent, T.Component.Hook[T.Component.HookEvent][]>
  > = {}
  #hookCbIds: string[] = []
  #component: WritableDraft<ComponentObject> | ComponentObject
  #children: T.ComponentInstance[] = []
  #id = ''
  #parent: T.ComponentInstance | null = null
  #type: C['type']
  original: ComponentObject

  static isComponent(component: any): component is T.ComponentInstance {
    return (
      !!component &&
      !u.isStr(component) &&
      (component instanceof Component || u.isFnc(component?.props))
    )
  }

  [Symbol.iterator]() {
    const entries = u.entries(this.#component)
    return {
      next() {
        return {
          done: !entries.length,
          value: entries.pop() || [],
        }
      },
    }
  }

  [u.inspect]() {
    return {
      ...this.toJSON(),
      blueprint: this.#blueprint,
      cache: this.#cache,
      hooks: this.hooks,
      hookIds: this.#hookCbIds,
      parentId: this.parent?.id,
    }
  }

  constructor(component: C, opts?: { id?: string }) {
    this.#blueprint = Component.isComponent(component)
      ? component.blueprint
      : component
    this.original = this.#blueprint
    this.#cache = {}
    this.#component = createComponentDraftSafely(
      component,
    ) as WritableDraft<ComponentObject>

    this.#id = opts?.id || this.#component.id || u.getRandomKey()
    this.#type = this.#blueprint.type
    // Immer proxies these actions objects. Since we need this to be
    // in its original form, we will convert these back to the original form
    userEvent.forEach((eventType) => {
      if (this.has(eventType)) {
        // If the cached handler is a function, it is caching a function that
        // was previously created internally. Since we need a reference to the
        // original action objects to re-create actions on-demand, we must
        // ensure that these are in their original form
        if (!this.#cache[eventType] || u.isFnc(this.#cache[eventType])) {
          this.#cache[eventType] = isDraft(this.#component[eventType])
            ? original(this.#component[eventType])
            : this.#component[eventType]
        }
      }
    })
  }

  get blueprint() {
    if (!this.#blueprint) this.#blueprint = { type: this.type }
    return this.#blueprint
  }

  get contentType() {
    return this.original?.contentType
  }

  get hooks() {
    return this.#hooks
  }

  get id() {
    return this.#id
  }

  get parent() {
    return this.#parent
  }

  /** Returns the most recent styles at the time of this call */
  get style() {
    if (!this.#component.style || u.isStr(this.#component.style)) {
      this.#component.style = {}
    }
    return this.#component.style as StyleObject
  }

  set style(style: StyleObject) {
    this.#component.style = style
  }

  get type() {
    return this.original.type
  }

  /**
   * Returns the value of the component property using key, or
   * Returns the value of the property of the component's style object
   * using styleKey if key === 'style'
   * @param { string } key - Component property or "style" if using styleKey for style lookups
   */
  get<K extends keyof ComponentObject>(
    key: K | K[],
    styleKey?: keyof StyleObject,
  ): ComponentObject[K] | Record<K, ComponentObject[K]> | undefined {
    if (typeof key === 'string') {
      // Returns the original type
      // TODO - Deprecate component.type since component.type is sufficient enough now
      if (key === 'type') return this.type
      const value = this.#retrieve(key, styleKey)
      return value
    }
    // component.get(['someKey', 'someOtherKey'])
    if (u.isArr(key)) {
      const value = {} as Record<K, ComponentObject[K]>
      key.forEach((k) => (value[k] = this.#retrieve(k)))
      return value
    }
  }

  /** Used by this.get */
  #retrieve = <K extends keyof ComponentObject | 'cache'>(
    key: K,
    styleKey?: keyof StyleObject,
  ) => {
    let value

    if (key === 'cache') {
      return this.#cache
    }
    if (key === 'style') {
      // Retrieve the entire style object
      if (styleKey === undefined) {
        value = isDraft(this.original.style)
          ? original(this.original.style)
          : this.original.style
      }
      // Retrieve a property of the style object
      else if (typeof styleKey === 'string') {
        value = this.original.style?.[styleKey]
      }
    } else {
      // Return the original type only for this case
      if (key === 'type') {
        value = this.original.type
      } else {
        value =
          this.#component[key as keyof ComponentObject] ||
          this.original[key as keyof ComponentObject]
      }
    }

    return isDraft(value) ? original(value) : value
  }

  /**
   * Sets a property's value on the component, or sets a property's value on the style
   * object if the key is "style", value is the styleKey and styleChanges is the value to update
   * on the style object's styleKey
   * @param { string } key - Key of component or "style" to update the style object using value
   * @param { any? } value - Value to update key, or styleKey to update the style object if key === 'style'
   * @param { any? } styleChanges - Value to set on a style object if key === 'style'
   */
  set<K extends string = any>(key: K, value?: any, styleChanges?: any): this
  set<O extends ComponentObject>(key: O, value?: any, styleChanges?: any): this
  set<K extends string = any>(key: K, value?: any, styleChanges?: any) {
    if (key === 'style') {
      this.style && (this.style[value] = styleChanges)
    } else {
      this.#component[key] = value
    }
    return this
  }

  /**
   * Merges values into a component's property using key or by using key as the incoming
   * values to merge directly into the component props if it is an object,.
   * You can also choose to merge into the style object if key === "style" and using
   * value as the styles
   * @param { string } key - Component property or "style" if using value to update the component's style object
   * @param { object? } value - Object to merge into the component props (or into the component's style object if key === "style")
   */
  assign(key: string | { [key: string]: any }, value?: { [key: string]: any }) {
    if (typeof key === 'string') {
      if (key === 'style') {
        if (typeof this.#component.style !== 'object') {
          log.func('assign')
          log.red(
            `Cannot assign style object properties to a type "${typeof this
              .#component.style}"`,
            { key, value, style: this.#component.style },
          )
        } else {
          u.assign(this.#component.style, value)
        }
      } else {
        u.assign(this.#component[key], value)
      }
    } else if (isPlainObject(key)) {
      u.assign(this.#component, key)
    }
    return this
  }

  /**
   * Returns true if the key exists on the blueprint
   * NOTE: It is very important to remember that this method only cares about
   * the blueprint!
   * @param { string } key - Component property or "style" if using styleKey for style lookups
   */
  has<K extends keyof ComponentObject>(key: K) {
    return key in (this.original || {})
  }

  /**
   * Removes a component property, or removes a style property from the style object
   * using styleKey if key === 'style'
   * @param { string } key - Component property, or "style" if removing a style property using styleKey
   */
  remove(key: string, styleKey?: keyof StyleObject) {
    if (key === 'style' && typeof styleKey === 'string') {
      if (this.#component.style) {
        delete this.#component.style[styleKey]
      }
    } else {
      delete this.#component[key]
    }
    return this
  }

  /* -------------------------------------------------------
  ---- Syntax sugar for working with styles
-------------------------------------------------------- */

  /**
   * Merges style props to the component's styles. Any styles with clashing names will be overridden
   * @param { object } styles
   */
  assignStyles(styles: Partial<StyleObject>) {
    return this.assign('style', styles)
  }

  /**
   * Retrieves a value from the style object using styleKey
   * @param { string } styleKey
   */
  getStyle<K extends keyof StyleObject>(styleKey: K) {
    return this.#component.style?.[styleKey]
  }

  /**
   * Updates/creates a new key/value into the style object using the styleKey and value
   * @param { string } styleKey
   * @param { any } value - Value to set for the styleKey
   */
  setStyle(styleKey: string, value: any): this
  setStyle<K extends keyof StyleObject>(styles: K): this
  setStyle<K extends keyof StyleObject>(styleKey: string | K, value?: any) {
    if (!this.#component.style) this.#component.style = {}
    if (typeof styleKey === 'string') {
      if (this.#component.style) {
        this.#component.style[styleKey] = value
      }
    } else if (typeof styleKey === 'string') {
      const style = this.#component.style as StyleObject
      u.entries(styleKey).forEach(([key, value]) => (style[key] = value))
    }
    return this
  }

  /**
   * Removes a property from the style object using the styleKey
   * @param { string } styleKey
   */
  removeStyle<K extends keyof StyleObject>(styleKey: K) {
    this.remove('style', styleKey)
    return this
  }

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
  toJS() {
    const obj = isDraft(this.#component)
      ? current(this.#component)
      : this.#component
    if (obj?.children) {
      return {
        ...obj,
        id: this.id,
        children: this.children.map((child) => child?.toJS?.()),
      }
    }
    return obj
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
    this.#children.push(child)
    return child
  }

  /**
   * Returns true if the child exists in the tree
   * @param { T.ComponentInstance | string } child - Child component or id
   */
  hasChild(child: string): boolean
  hasChild(child: T.ComponentInstance): boolean
  hasChild(child: T.ComponentInstance | string): boolean {
    if (typeof child === 'string') {
      return !!find(this.#children, (c) => c?.id === child)
    }
    if (Component.isComponent(child)) {
      return this.#children.includes(child)
    }
    return false
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
    } else if (this.hasChild(child as T.ComponentInstance)) {
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

  get children() {
    if (!this.#children) this.#children = []
    return this.#children
  }

  get length() {
    return this.#children?.length || 0
  }

  on<Evt extends T.Component.HookEvent>(
    eventName: Evt,
    cb: (...args: Parameters<T.Component.Hook[Evt]>) => void,
    id = '',
  ) {
    if (id) {
      // Prevents duplicates
      if (!this.#hookCbIds.includes(id)) this.#hookCbIds.push(id)
      else return this
    }
    !u.isArr(this.hooks[eventName]) && (this.hooks[eventName] = [])
    this.hooks[eventName]?.push(cb)
    return this
  }

  off<Evt extends T.Component.HookEvent>(
    eventName: Evt,
    cb: (...args: Parameters<T.Component.Hook[Evt]>) => void,
  ) {
    if (!u.isArr(this.hooks[eventName])) return this
    if (this.hooks[eventName]?.includes(cb)) {
      this.hooks[eventName]?.splice(
        this.#hooks[eventName]?.indexOf(cb) as number,
        1,
      )
    }
    return this
  }

  emit<Evt extends T.Component.HookEvent>(
    eventName: Evt,
    ...args: Parameters<T.Component.Hook[Evt]>
  ) {
    // log.func('emit')
    // log.grey(`Component emit: ${eventName}`, {
    //   args: arguments,
    //   component: this,
    // })
    this.#hooks[eventName]?.forEach((cb) => (cb as any)(...args))
    return this
  }

  clear(filter?: 'children' | 'hooks' | ('children' | 'hooks')[]) {
    const _clearChildren = () => (this.#children.length = 0)
    const _clearHooks = () => {
      u.keys(this.#hooks).forEach((evt) => (this.#hooks[evt].length = 0))
    }
    if (u.isArr(filter) || u.isStr(filter)) {
      u.array(filter).forEach((s: typeof filter) => {
        if (s === 'children') _clearChildren()
        else if (s === 'hooks') _clearHooks()
      })
      return this
    }
    _clearChildren()
    _clearHooks()
    return this
  }

  edit(fn: (props: ComponentObject) => ComponentObject | undefined | void): void
  edit(prop: Record<string, any>, opts?: EditResolutionOptions): void
  edit(prop: string, value: any): void
  edit(
    fn:
      | Record<string, any>
      | string
      | ((props: ComponentObject) => ComponentObject | undefined | void),
    value?: EditResolutionOptions,
  ) {
    if (u.isFnc(fn)) {
      const props = fn(this.#component)
      if (u.isObj(props)) {
        u.entries(props).forEach(([k, v]) => {
          if (k === 'style') {
            u.assign(this.style, v)
          } else {
            this.#component[k] = v
          }
        })
      }
    } else if (u.isStr(fn)) {
      this.#component[fn] = value
    } else if (u.isObj(fn)) {
      const remove = value?.remove
        ? (prop?: 'style') => {
            const obj = prop === 'style' ? this.style : this.#component
            if (u.isStr(value.remove)) {
              delete obj[value.remove]
            } else if (u.isArr(value.remove)) {
              value.remove.forEach((key) => delete obj[key])
            } else if (u.isObj(value.remove)) {
              u.entries(value.remove).forEach(
                ([k, pred]) => pred?.() && delete obj[k],
              )
            }
          }
        : undefined

      u.entries(fn).forEach(([k, v]) => {
        if (k === 'style') {
          if (u.isObj(v)) u.assign(this.style, v)
          else this.style = v
          remove?.('style')
        } else {
          this.#component[k] = v
          remove?.()
        }
      })
    }
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

  /** Returns the JS representation of the currently resolved component */
  toJSON() {
    const result = {} as ReturnType<T.IComponent['toJSON']>
    u.assign(result, this.props(), {
      parentId: this.parent?.id || '',
      children: this.children.map((child) => child?.toJSON?.()),
    })
    return result
  }
}

export default Component
