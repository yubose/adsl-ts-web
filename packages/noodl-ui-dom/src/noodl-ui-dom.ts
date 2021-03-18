import { ActionType, ComponentObject } from 'noodl-types'
import produce from 'immer'
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
  Page as PageComponent,
  publish,
  StoreActionObject,
  StoreBuiltInObject,
  ToastActionObject,
} from 'noodl-ui'
import { isEmitObj, isPluginComponent } from 'noodl-utils'
import { eventId } from './constants'
import {
  createAsyncImageElement,
  getShape,
  isPageConsumer,
} from './utils/utils'
import createResolver from './createResolver'
import NOODLUIDOMInternal from './Internal'
import Page from './Page'
import * as defaultResolvers from './resolvers'
import * as u from './utils/internal'
import * as T from './types'

const getDefaultRenderState = (
  initialState?: Record<string, any>,
): T.Render.State[keyof T.Render.State] => ({
  lastTop: 0,
  ...initialState,
})

class NOODLUIDOM extends NOODLUIDOMInternal {
  #R: ReturnType<typeof createResolver>
  #cbs = {
    page: {
      on: u
        .keys(eventId.page.on)
        .reduce(
          (acc, key) => u.assign(acc, { [eventId.page.on[key]]: [] }),
          {} as Record<keyof T.Observer, T.Observer[keyof T.Observer][]>,
        ),
    },
  }
  #state = { render: {} }
  page: Page

  constructor() {
    super()
    this.page = new Page(this.render.bind(this))
    this.#R = createResolver(this)
    this.#R.use(this)
    this.#R.use(u.values(defaultResolvers))
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

  get observers() {
    return this.#cbs
  }

  get state() {
    return this.#state
  }

  /**
   * Takes a list of raw NOODL components, converts to DOM nodes and appends to the DOM
   * @param { ComponentObject | ComponentObject[] } components
   */
  render(rawComponents: ComponentObject | ComponentObject[]) {
    this.reset({ only: 'render-state' })

    const currentPage = this.page.getState().current

    this.#state[currentPage] = getDefaultRenderState()

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

    const components = u.isArr(resolved) ? resolved : [resolved]

    this.emit(eventId.page.on.ON_DOM_CLEANUP, this.page.rootNode)

    this.page.rootNode.innerHTML = ''

    this.page.setStatus(eventId.page.status.RENDERING_COMPONENTS)

    components.forEach((component) => this.draw(component, this.page.rootNode))

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
      } else {
        node = document.createElement(
          getTagName(component as ComponentInstance),
        )
      }

      if (node) {
        const parent = container || document.body
        parent.appendChild(node)

        this.#R.run(node, component)

        component.children?.forEach?.(
          (child: ComponentInstance, index: number) => {
            const childNode = this.draw(child, node) as HTMLElement

            let appendChildArgs = {
              component: {
                instance: component,
                node: node as HTMLElement,
                bounds: node?.getBoundingClientRect() as DOMRect,
              },
              child: {
                instance: child,
                node: childNode,
                bounds: childNode.getBoundingClientRect(),
                index,
              },
            }

            this.emit(
              eventId.page.on[eventId.page.on.ON_BEFORE_APPEND_CHILD],
              appendChildArgs,
            )

            node?.appendChild(childNode)

            if (
              this.#cbs.page.on[eventId.page.on.ON_AFTER_APPEND_CHILD]?.length
            ) {
              this.emit(
                eventId.page.on.ON_AFTER_APPEND_CHILD,
                produce(appendChildArgs, (draft) => {
                  draft.component.bounds = node?.getBoundingClientRect() as any
                  draft.child.bounds = childNode?.getBoundingClientRect()
                }),
              )
            }

            appendChildArgs = null as any
          },
        )
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
      this.emit(eventId.page.on.ON_REDRAW_BEFORE_CLEANUP, node, component)
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

  emit<K extends keyof T.Observer>(evt: K, ...args: Parameters<T.Observer[K]>) {
    this.#cbs.page.on[evt]?.forEach?.((cb: any) =>
      (cb as any)?.call?.(this, ...args),
    )
    return this
  }

  on<K extends keyof T.Observer>(evt: K, fn: T.Observer[K]) {
    if (this.#cbs.page.on[evt] && !this.#cbs.page.on[evt].includes(fn)) {
      this.#cbs.page.on[evt].push(fn)
    }
    return this
  }

  off<K extends keyof T.Observer>(evt: K, fn: T.Observer[K]) {
    if (this.#cbs.page.on[evt]?.includes?.(fn)) {
      const index = this.#cbs.page.on[evt].indexOf(fn)
      this.#cbs.page.on[evt].splice(index, 1)
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
  register<R extends T.Resolve.Config>(obj: R): this
  register(
    obj:
      | T.Resolve.Config
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

  reset({ only }: { only?: ['render-state'] | 'render-state' } = {}) {
    if (only) {
      const fn = (val: any) => {
        if (val === 'render-state') {
          this.#state.render = getDefaultRenderState()
        }
      }
      ;(u.isArr(only) ? only : [only]).forEach(fn)
    } else {
      this.#R.clear()
      const clearCbs = (obj: any) => {
        if (u.isArr(obj)) {
          obj.length = 0
        } else if (obj && typeof obj === 'object') {
          u.values(obj).forEach((o) => clearCbs(o))
        }
      }
      u.values(this.#cbs).forEach((obj) => clearCbs(obj))
    }

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
