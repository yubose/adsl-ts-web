import cloneDeep from 'lodash/cloneDeep'
import { WritableDraft } from 'immer/dist/internal'
import { isDraft, original } from 'immer'
import { ComponentObject, StyleObject } from 'noodl-types'
import * as u from './utils/internal'
import * as T from './types'

type Hooks = Record<
  T.NUIComponent.HookEvent,
  T.NUIComponent.Hook[T.NUIComponent.HookEvent][]
>

class Component<C extends ComponentObject = ComponentObject>
  implements T.IComponent<C> {
  #blueprint: ComponentObject
  // This cache is used internally to cache original objects (ex: action objects)
  #cache: { [key: string]: any }
  #hooks = {} as Hooks
  #hookCbIds: string[] = []
  #component: WritableDraft<ComponentObject> | ComponentObject
  #children: T.NUIComponent.Instance[] = []
  #id = ''
  #parent: T.NUIComponent.Instance | null = null
  #propPath = ''
  original: ComponentObject
  type: C['type']

  static isComponent(component: any): component is T.NUIComponent.Instance {
    return (
      !!component &&
      !u.isStr(component) &&
      (component instanceof Component || 'blueprint' in component)
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
      type: this.type,
      blueprint: this.#blueprint,
      cache: this.#cache,
      hooks: this.hooks,
      hookIds: this.#hookCbIds,
    }
  }

  constructor(component: C, opts?: { id?: string }) {
    this.#blueprint = Component.isComponent(component)
      ? component.blueprint
      : component
    this.#cache = {}
    // this.#component = createComponentDraftSafely(
    //   this.#blueprint,
    // ) as WritableDraft<ComponentObject>
    this.#component = {
      ...this.#blueprint,
      style: { ...this.#blueprint.style },
    }
    this.#id = opts?.id || this.#component.id || u.getRandomKey()
    this.original = this.#blueprint
    this.type = this.#blueprint.type
  }

  get blueprint() {
    if (!this.#blueprint) this.#blueprint = { type: this.type }
    return this.#blueprint
  }

  get children() {
    if (!this.#children) this.#children = []
    return this.#children
  }

  get contentType() {
    return this.blueprint?.contentType
  }

  get hooks() {
    return this.#hooks
  }

  get id() {
    return this.#id
  }

  get length() {
    return this.children.length || 0
  }

  get parent() {
    return this.#parent
  }

  /**
   * Returns the value of the component property using key, or
   * Returns the value of the property of the component's style object
   * using styleKey if key === 'style'
   * @param { string } key - Component property or "style" if using styleKey for style lookups
   */
  get props() {
    return this.#component as ComponentObject & { id: string }
  }

  /** Returns the most recent styles at the time of this call */
  get style() {
    if (!this.props.style || u.isStr(this.props.style)) {
      this.props.style = {}
    }
    return this.props.style as StyleObject
  }

  set style(style: StyleObject) {
    this.#component.style = style
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
    if (u.isStr(key)) {
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
        value = isDraft(this.blueprint.style)
          ? original(this.blueprint.style)
          : this.blueprint.style
      }
      // Retrieve a property of the style object
      else if (u.isStr(styleKey)) {
        value = this.blueprint.style?.[styleKey]
      }
    } else {
      // Return the original type only for this case
      if (key === 'type') {
        value = this.blueprint.type
      } else {
        value =
          this.#component[key as keyof ComponentObject] ||
          this.#blueprint[key as keyof ComponentObject]
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
  remove(key: string, styleKey?: keyof StyleObject) {
    if (key === 'style' && u.isStr(styleKey)) {
      if (this.#component.style) {
        delete this.#component.style[styleKey]
      }
    } else {
      delete this.#component[key]
    }
    return this
  }

  get ppath() {
    return this.#propPath
  }

  set ppath(path) {
    this.#propPath = path
  }

  /* -------------------------------------------------------
  ---- Syntax sugar for working with styles
-------------------------------------------------------- */

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
    if (u.isStr(styleKey)) {
      if (this.#component.style) {
        this.#component.style[styleKey] = value
      }
    } else if (u.isStr(styleKey)) {
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

  /**
   * Returns a stringified JSON object of the current component
   * @param { number | undefined } spaces - Spaces to indent in the JSON string
   */
  toString({ spaces = 2 }: { spaces?: number } = {}) {
    return JSON.stringify(this.toJSON(), null, spaces)
  }

  setParent(parent: T.NUIComponent.Instance | null) {
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
    if (!u.isNum(index)) return this.children[0]
    return this.children[index]
  }

  /**
   * Creates and appends the new child instance to the childrens list
   * @param { IComponentType } props
   */
  createChild<C extends T.NUIComponent.Instance>(child: C): C {
    child?.setParent?.(this)
    this.#children.push(child)
    return child
  }

  /**
   * Removes a child from its children. You can pass in either the instance
   * directly, the index leading to the child, the component's id, or leave the args empty to
   * remove the first child by default
   * @param { T.NUIComponent.Instance | string | number | undefined } child - Child component, id, index, or no arg (to remove the first child by default)
   */
  removeChild(index: number): T.NUIComponent.Instance | undefined
  removeChild(id: string): T.NUIComponent.Instance | undefined
  removeChild(
    child: T.NUIComponent.Instance,
  ): T.NUIComponent.Instance | undefined
  removeChild(): T.NUIComponent.Instance | undefined
  removeChild(child?: T.NUIComponent.Instance | number | string) {
    if (child == undefined) {
      return this.children.shift()
    } else if (u.isNum(child)) {
      return this.children.splice(child, 1)[0]
    } else if (u.isStr(child)) {
      const index = this.children.findIndex((c) => c.id === child)
      if (index > -1) return this.children.splice(index, 1)[0]
    } else if (this.children.includes(child)) {
      return this.children.splice(this.children.indexOf(child), 1)[0]
    }
  }

  on<Evt extends T.NUIComponent.HookEvent>(
    eventName: Evt,
    cb: T.NUIComponent.Hook[Evt],
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

  off<Evt extends T.NUIComponent.HookEvent>(
    eventName: Evt,
    cb: T.NUIComponent.Hook[Evt],
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

  emit<Evt extends T.NUIComponent.HookEvent>(
    eventName: Evt,
    ...args: Parameters<T.NUIComponent.Hook[Evt]>
  ) {
    // console.log(
    //   `%cEmitting from a ${this.type}: ${eventName}`,
    //   `color:#95a5a6;`,
    //   {
    //     args: arguments,
    //     component: this,
    //   },
    // )
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

  /**
   * Explicitly setting style to null resets it back to an empty object
   * @param { string | function | object } props
   * @param { any | undefined } value
   */
  edit(fn: (props: ComponentObject) => ComponentObject | undefined | void): void
  edit(
    prop: Record<string, any>,
    opts?: T.NUIComponent.EditResolutionOptions,
  ): void
  edit(prop: string, value: any): void
  edit(
    fn:
      | Record<string, any>
      | string
      | ((props: ComponentObject) => ComponentObject | undefined | void),
    value?: T.NUIComponent.EditResolutionOptions,
  ) {
    if (u.isFnc(fn)) {
      const props = fn(this.props)
      if (u.isObj(props)) {
        u.entries(props).forEach(([k, v]) => {
          if (k === 'style') {
            u.assign(this.style, v)
          } else {
            this.props[k] = v
          }
        })
      }
    } else if (u.isStr(fn)) {
      this.props[fn] = value
    } else if (u.isObj(fn)) {
      const remove = value?.remove
        ? (prop?: 'style') => {
            const obj = prop === 'style' ? this.style : this.props
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
          if (v === null) this.style = {}
          else if (u.isObj(v)) u.assign(this.style, v)
          else this.style = v
          remove?.('style')
        } else {
          this.props[k] = v
          remove?.()
        }
      })
    }
  }

  /** Returns the JS representation of the currently resolved component */
  toJSON() {
    const result = {} as ReturnType<T.IComponent['toJSON']>
    u.assign(result, this.props, {
      parentId: this.parent?.id || null,
      children: this.children.map((child) => child?.toJSON?.()),
    })
    return result
  }
}

export default Component
