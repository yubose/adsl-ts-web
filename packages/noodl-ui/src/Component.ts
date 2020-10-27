import _ from 'lodash'
import { WritableDraft } from 'immer/dist/internal'
import { createDraft, isDraft, finishDraft, original, current } from 'immer'
import Logger from 'logsnap'
import { eventTypes } from './constants'
import {
  ComponentType,
  IComponent,
  IComponentEventId,
  NOODLActionObject,
  NOODLComponent,
  NOODLComponentProps,
  NOODLComponentType,
  NOODLStyle,
  ProxiedComponent,
} from './types'
import { forEachEntries } from './utils/common'

const log = Logger.create('Component')

class Component implements IComponent {
  #cb: { [eventName: string]: Function[] } = {}
  #component:
    | WritableDraft<ProxiedComponent & NOODLComponentProps>
    | (ProxiedComponent & NOODLComponentProps)
  #children: IComponent[] = []
  #id: string = ''
  #noodlType: NOODLComponentType
  #parent: IComponent | null = null
  #status: 'drafting' | 'idle' = 'drafting'
  #stylesHandled: string[] = []
  #stylesUnhandled: string[] = []
  action: NOODLActionObject = {} as NOODLActionObject
  context: { [key: string]: any } = {}
  original: NOODLComponent | ProxiedComponent | NOODLComponentProps | string
  resolved: boolean = false
  keys: string[]
  handled: string[] = []
  unhandled: string[] = []
  touched: string[] = []
  untouched: string[] = []
  stylesTouched: string[] = []
  stylesUntouched: string[] = []

  constructor(
    component: ComponentType,
    { parent }: { parent?: ComponentType } = {},
  ) {
    const keys =
      component instanceof Component ? component.keys : _.keys(component)
    this['original'] =
      component instanceof Component ? component.original : component
    this['keys'] = keys
    this['untouched'] = keys.slice()
    this['unhandled'] = keys.slice()

    if (parent) {
      this.#parent = (parent instanceof Component
        ? parent
        : new Component(parent)) as IComponent
    }

    this.#component = (isDraft(component)
      ? component
      : createDraft(component)) as WritableDraft<
      ProxiedComponent & NOODLComponentProps
    >

    this['id'] = component.id || _.uniqueId()
    this['noodlType'] = component.type

    if (!this.#component.style) this.#component['style'] = {}

    if (_.isPlainObject(component.style)) {
      const styleKeys = _.keys(component.style)
      this.#stylesUnhandled = styleKeys
      this['stylesUntouched'] = styleKeys.slice()
    }

    // Immer proxies these actions objects. Since we need this to be
    // in its original form, we will current these back to the original
    _.forEach(eventTypes, (eventType) => {
      if (component[eventType]) {
        this.action[eventType] = isDraft(component[eventType])
          ? original(component[eventType])
          : component[eventType]
      }
    })
  }

  /**
   * Returns the value of the component property using key, or
   * Returns the value of the property of the component's style object
   * using styleKey if key === 'style'
   * @param { string } key - Component property or "style" if using styleKey for style lookups
   */
  get<K extends keyof ProxiedComponent>(
    key: K,
    styleKey?: keyof NOODLStyle,
  ): ProxiedComponent[K]
  get<K extends keyof ProxiedComponent>(
    key: K[],
    styleKey?: keyof NOODLStyle,
  ): Record<K, ProxiedComponent[K]>
  get<K extends keyof ProxiedComponent>(
    key: K | K[],
    styleKey?: keyof NOODLStyle,
  ): ProxiedComponent[K] | Record<K, ProxiedComponent[K]> {
    let value: any

    if (_.isString(key)) {
      value = this.#retrieve(key, styleKey)
    } else if (_.isArray(key)) {
      value = {}
      _.forEach(key, (k) => {
        value[k] = this.#retrieve(k)
      })
    }

    // Return the original original type
    if (key === 'type') {
      return this.original.type
    }

    return isDraft(value) ? original(value) : value
  }

  /** Used by this.get */
  #retrieve = <K extends keyof ProxiedComponent>(
    key: K,
    styleKey?: keyof NOODLStyle,
  ) => {
    let value

    if (key === 'style') {
      // Retrieve the entire style object
      if (styleKey === undefined) {
        this.touch('style')
        value = isDraft(this.original.style)
          ? original(this.original.style)
          : this.original.style
      }
      // Retrieve a property of the style object
      else if (_.isString(styleKey)) {
        this.touchStyle(styleKey)
        value = this.original.style?.[styleKey]
      }
    } else {
      this.touch(key as string)
      // Return the original type only for this case
      if (key === 'type') {
        value = this.original.type
      } else {
        value =
          this.#component[key as keyof ProxiedComponent] ||
          this.original[key as keyof ProxiedComponent]
      }
    }

    return value
  }

  /**
   * Sets a property's value on the component, or sets a property's value on the style
   * object if the key is "style", value is the styleKey and styleChanges is the value to update
   * on the style object's styleKey
   * @param { string } key - Key of component or "style" to update the style object using value
   * @param { any? } value - Value to update key, or styleKey to update the style object if key === 'style'
   * @param { any? } styleChanges - Value to set on a style object if key === 'style'
   */
  set(key: string, value?: any, styleChanges?: any) {
    if (key === 'style') {
      if (this.#component.style) {
        this.#component.style[value] = styleChanges
        if (!this.isHandled('style')) this.#setHandledKey('style')
        this.#setHandledStyleKey(value)
      }
    } else {
      if (value) {
        this.#component[key] = value
        this.#setHandledKey(key)
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
    return this.original.type
  }

  get noodlType() {
    return this.#noodlType
  }

  set noodlType(value: NOODLComponentType) {
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

  touchStyle = (styleKey: string) => {
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
  has(key: string, styleKey?: keyof NOODLStyle) {
    if (key === 'style') {
      if (_.isString(styleKey)) {
        // TODO - Convert this to: "if (styleKey in this.#component.style)"
        const styleKeys = _.keys(this.#component.style)
        return styleKeys.includes(styleKey)
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
  remove(key: string, styleKey?: keyof NOODLStyle) {
    if (key === 'style' && _.isString(styleKey)) {
      if (this.#component.style) {
        delete this.#component.style[styleKey]
      }
    } else {
      delete this.#component[key]
    }
    return this
  }

  /**
   * Sets the id of this component
   * @param { string } id - Component id
   */
  setId(id: string) {
    if (this.#id) {
      log.func('setId')
      log.red(
        'This component already has an id assigned to it. You will have to ' +
          'create a new instance if you want to apply a different id',
      )
      return this
    }
    this.#id = id
    return this
  }

  /* -------------------------------------------------------
  ---- Syntax sugar for working with styles
-------------------------------------------------------- */

  /**
   * Merges style props to the component's styles. Any styles with clashing names will be overridden
   * @param { object } styles
   */
  assignStyles(styles: Partial<NOODLStyle>) {
    return this.assign('style', styles)
  }

  /**
   * Retrieves a value from the style object using styleKey
   * @param { string } styleKey
   */
  getStyle<K extends keyof NOODLStyle>(styleKey: K) {
    return this.#component.style?.[styleKey]
  }

  /**
   * Returns true of the component is using the styleKey in its style objext
   * @param { string } styleKey
   */
  hasStyle<K extends keyof NOODLStyle>(styleKey: K) {
    return this.has('style', styleKey)
  }

  /**
   * Updates/creates a new key/value into the style object using the styleKey and value
   * @param { string } styleKey
   * @param { any } value - Value to set for the styleKey
   */
  setStyle(styleKey: string, value: any): this
  setStyle<K extends keyof NOODLStyle>(styles: K): this
  setStyle<K extends keyof NOODLStyle>(styleKey: string | K, value?: any) {
    if (!this.#component.style) this.#component.style = {}
    if (_.isString(styleKey)) {
      if (this.#component.style) {
        this.#component.style[styleKey] = value
        this.touchStyle(styleKey)
      }
    } else if (_.isObject(styleKey)) {
      const style = this.#component.style as NOODLStyle
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
  removeStyle<K extends keyof NOODLStyle>(styleKey: K) {
    return this.remove('style', styleKey)
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
  toJS() {
    return isDraft(this.#component)
      ? current(this.#component as ProxiedComponent)
      : (this.#component as ProxiedComponent)
  }

  /** Returns a stringified JSON object of the current component */
  toString() {
    return JSON.stringify(this.toJS())
  }

  parent() {
    return this.#parent
  }

  hasParent() {
    return !!this.#parent && this.#parent instanceof Component
  }

  setParent(parent: IComponent | null) {
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
    let child: IComponent | undefined
    if (_.isNumber(index)) child = this.#children?.[index]
    else child = this.#children?.[0]
    return child || undefined
  }

  /**
   * Creates and appends the new child instance to the childrens list
   * @param { ComponentType | NOODLComponentType } props
   */
  createChild(
    child: ComponentType | NOODLComponentType,
  ): IComponent | undefined {
    let childComponent: IComponent
    let id: string = `${this.id}`
    if (this.length >= 1) id += `[${this.length}]`
    else id += '[0]'
    if (_.isString(child)) {
      childComponent = new Component({ type: child })
    } else if (child instanceof Component) {
      childComponent = child as IComponent
    } else {
      if (!child?.type) return
      childComponent = new Component({ ...child, id }) as IComponent
    }
    // Resync the child's id to match the parent's id. This can possibly be the
    // case when we're re-rendering and choose to pass in existing component
    // instances to shortcut into parsing
    if (id !== childComponent.id) childComponent['id'] = id
    childComponent.setParent(this as IComponent)
    this.#children.push(childComponent)
    return childComponent
  }

  /**
   * Returns true if the child exists in the tree
   * @param { Component | string } child - Child component or id
   */
  hasChild(child: IComponent | string): boolean {
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
   * @param { Component | number | undefined } child - Child or index
   */
  removeChild(child?: IComponent | number | string) {
    let removedChild: IComponent | undefined
    if (!arguments.length) {
      removedChild = this.#children.shift()
    } else if (_.isNumber(child) && this.#children[child]) {
      removedChild = this.#children.splice(child, 1)[0]
    } else if (_.isString(child)) {
      removedChild = child
        ? _.find(this.#children, (c) => c.id === child)
        : undefined
    } else if (this.hasChild(child as IComponent)) {
      if (this.#children.includes(child as IComponent)) {
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

  on(eventName: IComponentEventId, cb: Function) {
    if (!_.isArray(this.#cb[eventName])) this.#cb[eventName] = []
    this.#cb[eventName].push(cb)
    return this
  }

  off(eventName: IComponentEventId, cb: Function) {
    if (_.isArray(this.#cb[eventName])) {
      if (this.#cb[eventName].includes(cb)) {
        this.#cb[eventName] = _.filter(
          this.#cb[eventName],
          (callback) => callback !== cb,
        )
      }
    }
    return this
  }
}

export default Component
