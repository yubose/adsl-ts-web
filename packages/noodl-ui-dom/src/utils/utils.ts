import { ComponentObject, ComponentType, userEvent } from 'noodl-types'
import {
  ComponentInstance,
  findParent,
  isComponent,
  SelectOption,
  Viewport as VP,
} from 'noodl-ui'
import { NOODLDOMElement } from '../types'
import * as u from './internal'

export function addClassName(className: string, node: HTMLElement) {
  if (!node.classList.contains(className)) {
    node.classList.add(className)
  }
}

/**
 * Creates an image element that loads asynchronously
 * @param { HTMLElement } container - Element to attach the image in
 * @param { object } options
 * @param { function | undefined } options.onLoad
 */
export function createAsyncImageElement(
  container: HTMLElement,
  opts?: { onLoad?(event: Event): void },
) {
  let node = new Image()
  node.onload = (event) => {
    if (!container) container = document.body
    container.insertBefore(node as HTMLImageElement, container.childNodes[0])
    opts?.onLoad?.(event)
  }
  return node
}

export function createEmptyObjectWithKeys<K extends string = any, I = any>(
  keys: K[],
  initiatingValue?: I,
  startingValue?: any,
): Record<K, I> {
  return keys.reduce(
    (acc = {}, key) => Object.assign(acc, { [key]: initiatingValue }),
    startingValue,
  )
}

export function getTagName(
  component: ComponentInstance,
): keyof HTMLElementTagNameMap {
  switch (component?.type) {
    case 'br':
      return 'br'
    case 'button':
      return 'button'
    case 'date':
    case 'dateSelect':
    case 'searchBar':
    case 'textField':
      return 'input'
    case 'divider':
      return 'hr'
    case 'image':
      return 'img'
    case 'list':
      return 'ul'
    case 'listItem':
      return 'li'
    case 'page':
      return 'iframe'
    case 'pluginHead':
    case 'pluginBodyTail':
      return 'script'
    case 'select':
      return 'select'
    case 'textView':
      return 'textarea'
    case 'chart':
    case 'footer':
    case 'header':
    case 'label':
    case 'map':
    case 'plugin':
    case 'popUp':
    case 'register':
    case 'scrollView':
    case 'view':
      return 'div'
    case 'video':
      return 'video'
    default:
      console.log(
        `%cNone of the node types matched with "${component?.type}". Perhaps it needs to be ' +
        'supported? (Defaulting to "div" instead)`,
        'color:#e74c3c;font-weight:bold;',
        component.toJSON(),
      )
      return 'div'
  }
}

/**
 * Creates a function that queries for a DOM node.
 * This method searches through several window/document objects and is most
 * useful for page consumer components
 * @param { string } key
 * @param { function } fn
 */
export function makeFinder(
  key: 'id' | 'viewTag',
  fn: (
    id: string,
    doc?: Document | null | undefined,
  ) => NOODLDOMElement | HTMLElement | Element | null,
) {
  const find = (
    c: string | ComponentInstance,
  ): NOODLDOMElement | HTMLElement | Element | null => {
    let str = ''
    let cb = (doc: Document | null | undefined) => fn(str, doc)
    if (!c) return null
    if (u.isStr(c)) {
      str = c
    } else {
      str = c?.[key] || c?.get?.(key) || c?.original?.[key] || ''
      if (isPageConsumer(c)) return cb(findWindowDocument((doc) => !!cb(doc)))
    }
    // return fn(str)
    return cb(findWindowDocument((doc) => !!cb(doc)))
  }
  return find
}

export const findByElementId = makeFinder('id', getByElementId)
export const findByViewTag = makeFinder('viewTag', getByViewTag)
export const findAllByViewTag = makeFinder('viewTag', getByAllViewTag)

export function findWindow(
  cb: (
    win: Window | HTMLIFrameElement['contentWindow'],
  ) => boolean | null | undefined,
) {
  if (isBrowser()) {
    if (window.length) {
      let index = 0
      while (index < window.length) {
        if (cb(window[index])) return window[index]
        index++
      }
    } else {
      if (cb(window)) return window
    }
  }
  return null
}

export function findWindowDocument(
  cb: (
    doc: Document | HTMLIFrameElement['contentDocument'],
  ) => boolean | null | undefined,
) {
  let win: Window | null | undefined
  win = findWindow((w) => {
    try {
      return cb(w?.['contentDocument'] || w?.document)
    } catch (error) {
      // Allow the loop to continue if it is accessing an outside origin window
      if (error.name === 'SecurityError' || error.code === 18) {
      } else {
        console.error(`[${error.name}]: ${error.message}`)
      }
      return false
    }
  })
  return (win?.['contentDocument'] || win?.document) as
    | Document
    | HTMLIFrameElement['contentDocument']
}

export const get = <T = any>(o: T, k: string) => {
  if (!u.isObj(o) || !u.isStr(k)) return

  let parts = k.split('.').reverse()
  let result: any = o
  let key = ''

  while (parts.length) {
    key = parts.pop() as string
    result = result[key]
  }

  return result
}

export function getByDataKey(
  value: string,
  doc?: Document | null | undefined,
): NOODLDOMElement | Element | null {
  return (doc || document).querySelector(`[data-key="${value}"]`)
}

export function getByListId(
  value: string,
  doc?: Document | null | undefined,
): NOODLDOMElement | Element | null {
  return (doc || document).querySelector(`[data-listid="${value}"]`)
}

export function getByViewTag(
  value: string,
  doc?: Document | null | undefined,
): NOODLDOMElement | Element | null {
  return (doc || document).querySelector(`[data-viewtag="${value}"]`)
}

export function getByAllViewTag(
  value: string,
  doc?: Document | null | undefined,
): NodeListOf<NOODLDOMElement | Element> {
  return (doc || document).querySelectorAll(`[data-viewtag="${value}"]`)
}

export function getByElementId(
  id: string,
  doc?: Document | null | undefined,
): NOODLDOMElement | Element | null {
  return (doc || document).getElementById(id)
}

export function getDataAttribKeys() {
  return [
    'data-key',
    'data-listid',
    'data-name',
    'data-viewtag',
    'data-value',
    'data-ux',
  ] as (
    | 'data-key'
    | 'data-listid'
    | 'data-name'
    | 'data-viewtag'
    | 'data-value'
    | 'data-ux'
  )[]
}

/**
 * Returns the expected height (using top and height) of the element in the DOM
 * This is a shallow calculation which doesn't take into account its children or
 * its parent
 * @param { HTMLElement } node
 * @param { ComponentInstance } component
 */
export function getDisplayHeight({
  component: c,
  viewport: vp,
  unit = 'px',
}: {
  component: ComponentInstance
  viewport: VP
  unit?: Pick<NonNullable<Parameters<typeof VP['getSize']>[2]>, 'unit'>['unit']
}) {
  let result = 0
  if (c) {
    u.yKeys.forEach((key) => {
      const value = c.style?.[key]
      if (!u.isNil(value) && VP.isNoodlUnit(value)) result += Number(value)
    })
  }
  return VP.getSize(String(result), vp.height as number, {
    unit,
  }) as number
}

/**
 *
 * @param { ComponentInstance | ComponentObject | ComponentType } component - NOODL component object, instance, or type
 */
export function getShape(
  component: ComponentInstance,
  opts?: { parent?: ComponentObject; shapeKeys?: string[] },
): ComponentObject
export function getShape(
  noodlComponent: ComponentObject,
  opts?: { parent?: ComponentObject; shapeKeys?: string[] },
): ComponentObject
export function getShape(
  componentType: ComponentType,
  opts?: { parent?: ComponentObject; shapeKeys?: string[] },
): ComponentObject
export function getShape(
  components: (ComponentInstance | ComponentObject | ComponentType)[],
  opts?: { parent?: ComponentObject; shapeKeys?: string[] },
): ComponentObject
export function getShape(
  component: ComponentInstance | ComponentObject | ComponentType,
  opts?: { parent?: ComponentObject; shapeKeys?: string[] },
): ComponentObject {
  const shape = {} as ComponentObject
  let shapeKeys = getShapeKeys()
  if (opts?.parent) {
    shapeKeys = shapeKeys.concat(
      getDynamicShapeKeys(
        opts.parent,
        isComponent(component)
          ? component.original
          : (component as ComponentObject),
      ),
    )
  }
  if (opts?.shapeKeys) {
    shapeKeys = shapeKeys.concat(opts.shapeKeys)
  }

  if (isComponent(component)) {
    return getShape(component.original, { ...opts, parent: component.original })
  } else if (u.isStr(component)) {
    return { type: component }
  } else if (u.isArr(component)) {
    return component.map((c) => getShape(c, opts)) as any
  } else if (component && u.isObj(component)) {
    const noodlComponent = component as ComponentObject
    // The noodl yml may also place the value of iteratorVar as a property
    // as an empty string. So we include the value as a property to keep as well
    shapeKeys.forEach((key) => {
      if (key in noodlComponent) {
        if (key === 'children') {
          // @ts-expect-error
          shape.children = u.isArr(noodlComponent.children)
            ? (noodlComponent.children as ComponentObject[])?.map(
                (noodlChild) =>
                  getShape(noodlChild, {
                    ...opts,
                    parent: noodlComponent,
                  }),
              )
            : getShape(noodlComponent.children as any, {
                ...opts,
                // @ts-expect-error
                type:
                  (opts as any)?.type ||
                  (u.isObj(noodlComponent.children)
                    ? (noodlComponent.children as any).type ||
                      (noodlComponent.children as any).type
                    : u.isStr(noodlComponent.children)
                    ? noodlComponent.children
                    : undefined) ||
                  (opts as any)?.type,
                parent: noodlComponent,
              })
        } else {
          shape[key] = noodlComponent[key]
        }
      }
    })
  }
  return shape
}

export function getShapeKeys<K extends keyof ComponentObject>(...keys: K[]) {
  const regex = /(required?)\s*$/i
  return [
    'type',
    'style',
    'children',
    'controls',
    'dataKey',
    'contentType',
    'inputType',
    'isEditable',
    'iteratorVar',
    'listObject',
    'maxPresent',
    'type',
    'options',
    'path',
    'pathSelected',
    'poster',
    'placeholder',
    'resource',
    'required',
    'selected',
    'text',
    'textSelectd',
    'textBoard',
    'text=func',
    'viewTag',
    'videoFormat',
    ...userEvent,
    ...keys,
  ] as string[]
}

/**
 * Returns the HTML DOM node or an array of HTML DOM nodes using the data-ux,
 * otherwise returns null
 * @param { string } key - The value of a data-ux element
 */
export function getByDataUX(key: string) {
  if (u.isStr(key)) {
    const nodeList = document.querySelectorAll(`[data-ux="${key}"]`) || null
    if (nodeList.length) {
      const nodes = [] as HTMLElement[]
      nodeList.forEach((node: HTMLElement, key) => {
        nodes.push(node)
      })
      return nodes.length === 1 ? nodes[0] : nodes
    }
  }
  return null
}

export function getDynamicShapeKeys(
  noodlParent: ComponentObject,
  noodlChild: ComponentObject,
) {
  const shapeKeys = [] as string[]
  if (noodlParent?.iteratorVar) {
    if (noodlParent.iteratorVar in noodlChild) {
      shapeKeys.push(noodlParent.iteratorVar)
    }
  }
  return shapeKeys
}

export function isBrowser() {
  return typeof window !== 'undefined'
}

/**
 * Returns true if the value can be displayed in the UI as normal.
 * A displayable value is any value that is a string or number
 * @param { any } value
 */
export function isDisplayable(value: unknown): value is string | number {
  return value == 0 || u.isStr(value) || u.isNum(value)
}

/**
 * Returns true if the component is a descendant of a component of type: "page"
 * @param { ComponentInstance } component
 */
export function isPageConsumer(component: any): boolean {
  return isComponent(component)
    ? !!findParent(component, (parent) => parent?.type === 'page')
    : false
}

export function normalizeEventName(eventName: string) {
  return u.isStr(eventName)
    ? eventName.startsWith('on')
      ? eventName.replace('on', '').toLowerCase()
      : eventName.toLowerCase()
    : eventName
}

/**
 * Simulates a user-click and opens the link in a new tab.
 * @param { string } url - An outside link
 */
export function openOutboundURL(url: string) {
  if (typeof window !== 'undefined') {
    window.location.href = url
  }
}

export function optionExists(node: HTMLSelectElement, option: any) {
  return (
    !!node &&
    !!option &&
    [...node.options].some((opt) => opt.value === toSelectOption(option).value)
  )
}

export function isTextFieldLike(
  node: unknown,
): node is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return !!(
    node &&
    node instanceof HTMLElement &&
    (node.tagName === 'INPUT' ||
      node.tagName === 'SELECT' ||
      node.tagName === 'TEXTAREA')
  )
}

export function toSelectOption(value: any): SelectOption {
  if (!u.isObj(value)) {
    return { key: value, label: value, value }
  }
  return value as SelectOption
}
