import _ from 'lodash'
import Logger from 'logsnap'
import { WritableDraft } from 'immer/dist/internal'
import { createDraft, isDraft, finishDraft, original, current } from 'immer'
import { eventTypes } from '../../constants'
import {
  ActionObject,
  ComponentCreationType,
  ComponentObject,
  ComponentType,
  IComponent,
  NOODLComponent,
  ProxiedComponent,
  Style,
} from '../../types'
import createComponentDraftSafely from '../../utils/createComponentDraftSafely'
import { forEachEntries, getRandomKey } from '../../utils/common'

const log = Logger.create('Base')

// Current component events: 'path' attached by createSrc

class Component implements IComponent {
  // This cache is used internally to cache original objects (ex: action objects)
  #cache: { [key: string]: any }
  #cb: { [eventName: string]: Function[] } = {}
  #component: WritableDraft<ComponentObject> | ComponentObject
  #children: Component[] = []
  #id: string = ''
  #noodlType: ComponentType
  #parent: Component | null = null
  #status: 'drafting' | 'idle' = 'drafting'
  #stylesHandled: string[] = []
  #stylesUnhandled: string[] = []
  action: ActionObject = {} as ActionObject
  context: { [key: string]: any } = {}
  original: ComponentObject
  resolved: boolean = false
  keys: string[]
  handled: string[] = []
  unhandled: string[] = []
  touched: string[] = []
  untouched: string[] = []
  stylesTouched: string[] = []
  stylesUntouched: string[] = []

  constructor(component: ComponentCreationType) {
    const keys =
      component instanceof Component
        ? component.keys
        : _.keys(_.isString(component) ? { type: component } : component)
    this['original'] =
      component instanceof Component
        ? component.original
        : _.isString(component)
        ? { noodlType: component }
        : (component as any)
    this['keys'] = keys
    this['untouched'] = keys.slice()
    this['unhandled'] = keys.slice()

    this.#cache = {}
    this.#component = createComponentDraftSafely(component) as WritableDraft<
      ComponentObject
    >

    this['id'] = this.#component.id || getRandomKey()
    this['noodlType'] = this.#component.noodlType as any

    if (!this.#component.style) this.#component['style'] = {}

    if (_.isPlainObject(this.#component.style)) {
      this.#stylesUnhandled = _.keys(this.#component.style)
      this['stylesUntouched'] = this.#stylesUnhandled.slice()
    } else if (isDraft(this.#component.style)) {
      // this.#component.style = current(this.#component.style)
    }

    // Immer proxies these actions objects. Since we need this to be
    // in its original form, we will convert these back to the original form
    _.forEach(eventTypes, (eventType) => {
      if (keys.includes(eventType)) {
        // If the cached handler is a function, it is caching a function that
        // was previously created internally. Since we need a reference to the
        // original action objects to re-create actions on-demand, we must
        // ensure that these are in their original form
        if (
          !this.#cache[eventType] ||
          typeof this.#cache[eventType] === 'function'
        ) {
          this.#cache[eventType] = isDraft(this.#component[eventType])
            ? original(this.#component[eventType])
            : this.#component[eventType]
        }
        // TODO - Find out more about how our code is using this around the app
        // this.action[eventType] = isDraft(component[eventType])
        //   ? original(component[eventType])
        //   : component[eventType]
      }
    })

    // Immer proxifies some funcs / objects but we need them in their original form
    // in the resolve process, so we need to convert them to their original form
    _.forEach(keys, (key) => {
      if (isDraft(this.#component[key])) {
        const orig = original(this.#component[key])
        // this.#component[key] = original(this.#component[key])
        if (_.isObject(this.original)) {
          // this.original[key] = orig
        }
      }
    })
  }

  /**
   * Returns the value of the component property using key, or
   * Returns the value of the property of the component's style object
   * using styleKey if key === 'style'
   * @param { string } key - Component property or "style" if using styleKey for style lookups
   */
  get<K extends keyof ComponentObject>(
    key: K,
    styleKey?: keyof Style,
  ): ComponentObject[K]
  get<K extends keyof ComponentObject>(
    key: K[],
    styleKey?: keyof Style,
  ): Record<K, ComponentObject[K]>
  get<K extends keyof ComponentObject>(
    key: K | K[],
    styleKey?: keyof Style,
  ): ComponentObject[K] | Record<K, ComponentObject[K]> | undefined {
    if (_.isString(key)) {
      // Returns the original type
      // TODO - Deprecate component.noodlType since component.type is sufficient enough now
      if (key === 'type') return this.original.type as any
      const value = this.#retrieve(key, styleKey)
      return value
    }
    // component.get(['someKey', 'someOtherKey'])
    else if (_.isArray(key)) {
      const value = {} as Record<K, ComponentObject[K]>
      _.forEach(key, (k) => (value[k] = this.#retrieve(k)))
      return value
    }
  }

  /** Used by this.get */
  #retrieve = <K extends keyof ComponentObject | 'cache'>(
    key: K,
    styleKey?: keyof Style,
  ) => {
    let value

    if (key === 'cache') {
      return this.#cache
    } else if (key === 'style') {
      // Retrieve the entire style object
      if (styleKey === undefined) {
        if (this.status !== 'drafting') this.touch('style')
        value = isDraft(this.original.style)
          ? original(this.original.style)
          : this.original.style
      }
      // Retrieve a property of the style object
      else if (_.isString(styleKey)) {
        if (this.status !== 'drafting') this.touchStyle(styleKey)
        value = this.original.style?.[styleKey]
      }
    } else {
      if (this.status !== 'drafting') this.touch(key as string)
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
      if (this.#component.style) {
        this.#component.style[value] = styleChanges
        if (!this.isHandled('style')) {
          this.#setHandledKey('style')
        }
        this.#setHandledStyleKey(value)
      }
    } else {
      if (key === 'type') this.#component['type'] = value
      else {
        this.#component[key as keyof ComponentObject] = value
        if (this.status !== 'drafting') this.#setHandledKey(key as string)
      }
    }
    return this
  }

  get contentType() {
    return this.#component.contentType
  }

  get id() {
    return this.#id || ''
  }

  set id(value: string) {
    this.#id = value
  }

  get type() {
    return this.#component?.type as ComponentType
  }

  get noodlType() {
    return this.#noodlType
  }

  set noodlType(value: ComponentType) {
    this.#noodlType = value
  }

  /** Returns the most recent styles at the time of this call */
  get style() {
    return (
      (isDraft(this.#component.style)
        ? current(this.#component.style)
        : this.#component.style) || {}
    )
  }

  get status() {
    return isDraft(this.#status) ? current(this.#status) : this.#status
  }

  /**
   * Turns the mode of this component to "drafting" state. This allows
   * mutations to be set on this instance until .done() is called
   */
  draft() {
    this.#status = 'drafting'
    this.#component = isDraft(this.#component)
      ? this.#component
      : createDraft(this.#component)
    return this
  }

  /**
   * Turns the mode of this component to 'idle' and sets this.resolved to true
   * When the status is "idle", this component should not perform any mutation
   * operations unless this.draft() is called
   */
  done({ mergeUntouched = false } = {}) {
    if (this.status === 'drafting') {
      if (mergeUntouched) {
        _.forEach(this.untouched, (untouchedKey) => {
          this.set(untouchedKey, this.#component[untouchedKey])
        })
      }
      // Prevent style keys that are not in valid DOM shapes from leaking to the DOM
      _.forEach(
        ['border', 'isHidden', 'required', 'shadow', 'textColor'] as const,
        (styleKey) => {
          this.removeStyle(styleKey)
        },
      )
      this.#component = isDraft(this.#component)
        ? finishDraft(this.#component)
        : this.#component
      this.#status = 'idle'
      if (_.isArray(this.#cb.resolved)) {
        _.forEach(this.#cb.resolved, (fn) => fn(this.#component))
      }
    }
    // this.resolved is meant to be set only once as soon as it has been set
    // to true the first time
    if (this.resolved === undefined) this['resolved'] = true
    return this
  }

  touch(key: string) {
    // Only operate on the props that this component was provided with
    if (this.keys.includes(key)) {
      if (!this.isTouched(key)) this.touched.push(key)
      const index = this.untouched.indexOf(key)
      if (index !== -1) this.untouched.splice(index, 1)
    }
    return this
  }

  isTouched(key: string) {
    return this.touched.includes(key)
  }

  touchStyle(styleKey: string) {
    if (!this.isStyleTouched(styleKey)) this.stylesTouched.push(styleKey)
    const index = this.stylesUntouched.indexOf(styleKey)
    if (index !== -1) this.stylesUntouched.splice(index, 1)
    return this
  }

  isStyleTouched(styleKey: string) {
    return this.stylesTouched.includes(styleKey)
  }

  isHandled(key: string) {
    return this.handled.includes(key)
  }

  isStyleHandled(styleKey: string) {
    return this.#stylesHandled.includes(styleKey)
  }

  #setHandledKey = (key: string) => {
    if (!this.isHandled(key)) this.handled.push(key)
    const index = this.unhandled.indexOf(key)
    if (index !== -1) this.unhandled.splice(index, 1)
    return this
  }

  #setHandledStyleKey = (styleKey: string) => {
    if (!this.isStyleHandled(styleKey)) this.#stylesHandled.push(styleKey)
    const index = this.#stylesUnhandled.indexOf(styleKey)
    if (index !== -1) this.#stylesUnhandled.splice(index, 1)
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
    if (_.isString(key)) {
      if (key === 'style') {
        _.assign(this.#component.style, value)
      } else {
        _.assign(this.#component[key], value)
      }
    } else if (_.isPlainObject(key)) {
      _.assign(this.#component, key)
    }
    return this
  }

  /**
   * Returns true if the key exists on the component, false otherwise.
   * Returns true if the styleKey exists on the component's style object if key === 'style', false otherwise.
   * @param { string } key - Component property or "style" if using styleKey for style lookups
   * @param { string? } styleKey - Style property if key === 'style'
   */
  has(key: string, styleKey?: keyof Style) {
    if (key === 'style') {
      if (_.isString(styleKey)) {
        return styleKey in (this.#component.style || {})
      }
      return false
    }
    return key in (this.#component || {})
  }

  /**
   * Merges value into the component's property using key, or merges value into the style object if key === "string",
   * or merges props directly into the component if key is an object
   * @param { string | object } key - Component property or "style" if merging into the style object, or an object of component props to merge directly into the component
   */
  merge(key: string | { [key: string]: any }, value?: any) {
    if (_.isString(key)) {
      if (key === 'style') {
        _.merge(this.#component.style, value)
      } else {
        _.merge(this.#component, value)
      }
    } else if (_.isPlainObject(key)) {
      _.merge(this.#component, key)
    }
    return this
  }

  /**
   * Removes a component property, or removes a style property from the style object
   * using styleKey if key === 'style'
   * @param { string } key - Component property, or "style" if removing a style property using styleKey
   */
  remove(key: string, styleKey?: keyof Style) {
    if (key === 'style' && _.isString(styleKey)) {
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
  assignStyles(styles: Partial<Style>) {
    return this.assign('style', styles)
  }

  /**
   * Retrieves a value from the style object using styleKey
   * @param { string } styleKey
   */
  getStyle<K extends keyof Style>(styleKey: K) {
    return this.#component.style?.[styleKey]
  }

  /**
   * Returns true of the component is using the styleKey in its style objext
   * @param { string } styleKey
   */
  hasStyle<K extends keyof Style>(styleKey: K) {
    return this.has('style', styleKey)
  }

  /**
   * Updates/creates a new key/value into the style object using the styleKey and value
   * @param { string } styleKey
   * @param { any } value - Value to set for the styleKey
   */
  setStyle(styleKey: string, value: any): this
  setStyle<K extends keyof Style>(styles: K): this
  setStyle<K extends keyof Style>(styleKey: string | K, value?: any) {
    if (!this.#component.style) this.#component.style = {}
    if (_.isString(styleKey)) {
      if (this.#component.style) {
        this.#component.style[styleKey] = value
        this.touchStyle(styleKey)
      }
    } else if (_.isObject(styleKey)) {
      const style = this.#component.style as Style
      forEachEntries(styleKey, (key, value) => {
        style[key] = value
      })
    }
    return this
  }

  /**
   * Removes a property from the style object using the styleKey
   * @param { string } styleKey
   */
  removeStyle<K extends keyof Style>(styleKey: K) {
    this.remove('style', styleKey)
    return this
  }

  /**
   * Returns the most recent
   * component object at the time of this call.
   * If it is still a draft it is converted into plain JS
   */
  snapshot() {
    return _.assign(
      { id: this.#id, noodlType: this.original.type },
      this.toJS(),
      {
        _cache: this.#cache,
        _touched: this.touched,
        _untouched: this.untouched,
        _touchedStyles: this.stylesTouched,
        _untouchedStyles: this.stylesUntouched,
        _handled: this.handled,
        _unhandled: this.unhandled,
      },
    )
  }

  /** Returns the JS representation of the currently resolved component */
  toJS(): ProxiedComponent {
    const obj = isDraft(this.#component)
      ? current(this.#component)
      : this.#component
    if (obj?.children) {
      return {
        ...obj,
        ...this.action,
        id: this.id,
        children: _.map(this.children(), (child) => child?.toJS?.()),
      }
    }
    return { ...obj, ...this.action }
  }

  /**
   * Returns a stringified JSON object of the current component
   * @param { number | undefined } spaces - Spaces to indent in the JSON string
   */
  toString({ spaces = 2 }: { spaces?: number } = {}) {
    return JSON.stringify(this.toJS(), null, spaces)
  }

  parent() {
    return this.#parent as any
  }

  hasParent() {
    return !!this.#parent && this.#parent instanceof Component
  }

  setParent(parent: Component | null) {
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
  createChild<C extends Component>(child: C): C {
    child?.setParent?.(this)
    this.#children.push(child)
    return child
  }

  /**
   * Returns true if the child exists in the tree
   * @param { Component | string } child - Child component or id
   */
  hasChild(child: string): boolean
  hasChild(child: Component): boolean
  hasChild(child: Component | string): boolean {
    if (_.isString(child)) {
      return !!_.find(this.#children, (c) => c?.id === child)
    } else if (child instanceof Component) {
      return this.#children.includes(child)
    }
    return false
  }

  /**
   * Removes a child from its children. You can pass in either the instance
   * directly, the index leading to the child, the component's id, or leave the args empty to
   * remove the first child by default
   * @param { Component | string | number | undefined } child - Child component, id, index, or no arg (to remove the first child by default)
   */
  removeChild(index: number): Component | undefined
  removeChild(id: string): Component | undefined
  removeChild(child: Component): Component | undefined
  removeChild(): Component | undefined
  removeChild(child?: Component | number | string) {
    let removedChild: Component | undefined
    if (!arguments.length) {
      removedChild = this.#children.shift()
    } else if (_.isNumber(child) && this.#children[child]) {
      removedChild = this.#children.splice(child, 1)[0]
    } else if (_.isString(child)) {
      removedChild = child
        ? _.find(this.#children, (c) => c.id === child)
        : undefined
    } else if (this.hasChild(child as Component)) {
      if (this.#children.includes(child as Component)) {
        this.#children = _.filter(this.#children, (c) => {
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

  children() {
    return this.#children || []
  }

  get length() {
    return this.#children?.length || 0
  }

  /**
   * Recursively invokes the provided callback on each child
   * @param { Component }  - child
   */
  broadcast(cb: (child: Component) => void) {
    const notify = (child: Component) => {
      cb(child)
      if (child) _.forEach(child.children(), (c) => notify(c))
    }
    _.forEach(this.children(), (child) => notify(child))
    return this
  }

  /**
   *
   * Recursively invokes the provided callback on each raw noodl child
   * @param { Component } child
   */
  broadcastRaw(cb: (c: Component, nc: NOODLComponent, index: unknown) => void) {
    const notify = (c: Component) => {
      _.forEach(
        c.original?.children || [],
        (noodlChild: NOODLComponent, index) => {
          cb?.(c, noodlChild, index)
          c.children().forEach((cc) => notify(cc))
        },
      )
    }
    notify(this)
    return this
  }

  on(eventName: string, cb: Function) {
    if (!_.isArray(this.#cb[eventName])) this.#cb[eventName] = []
    log.func(`on [${this.noodlType}]`)
    log.grey(`Subscribing listener for "${eventName}"`, this)
    this.#cb[eventName].push(cb)
    return this
  }

  off(eventName: any, cb: Function) {
    if (_.isArray(this.#cb[eventName])) {
      if (this.#cb[eventName].includes(cb)) {
        log.func(`off [${this.noodlType}]`)
        log.grey(`Removing listener for "${eventName}"`, this)
        this.#cb[eventName].splice(this.#cb[eventName].indexOf(cb), 1)
      }
    }
    return this
  }

  emit(eventName: string, ...args: any[]) {
    log.func(`emit [${this.noodlType}]`)
    _.forEach(this.#cb[eventName] || [], (fn) => {
      log.grey(`Dispatching event for "${eventName}"`, {
        component: this,
        args,
      })
      fn(...args)
    })
    return this
  }

  getCbs() {
    return this.#cb
  }

  hasCb(eventName: string, cb: Function) {
    return !!this.#cb[eventName]?.includes?.(cb)
  }

  clearCbs() {
    Object.keys(this.#cb).forEach((eventName) => {
      if (Array.isArray(this.#cb[eventName])) {
        this.#cb[eventName].length = 0
      }
    })
    return this
  }
}

export default Component
