import {
  findParent,
  isComponent,
  NUIComponent,
  NUIComponentType,
  pullFromComponent,
  SelectOption,
} from 'noodl-ui'
import { LiteralUnion } from 'type-fest'
import * as u from '@jsmanifest/utils'
import NDOMGlobal from '../Global'
import findElement from './findElement'
import { DOMNodeInput, NOODLDOMDataAttribute } from '../types'
import { dataAttributes } from '../constants'

export function addClassName(className: string, node: HTMLElement) {
  if (!node.classList.contains(className)) {
    node.classList.add(className)
  }
}

/**
 * Normalizes the queried nodes to an HTMLElement or an array of HTMLElement
 * @param { NodeList | HTMLCollection | HTMLElement } nodes
 */
export function asHtmlElement(nodes: DOMNodeInput) {
  if (nodes instanceof NodeList || nodes instanceof HTMLCollection) {
    if (nodes.length === 0) return null
    if (nodes.length === 1) return nodes.item(0) as HTMLElement
    const results = [] as HTMLElement[]
    for (const node of nodes) results.push(node as HTMLElement)
    return results
  }
  return nodes || null
}

/**
 * Returns the DOM element tag name for the NOODL component
 * @param { NUIComponent.Instance | NUIComponentType } component
 */
export function getElementTag(
  component: NUIComponent.Instance | NUIComponentType | undefined,
): keyof HTMLElementTagNameMap {
  const componentType = u.isStr(component) ? component : component?.type || ''
  const tagName = getElementTag.prototype.elementMap[componentType]

  if (!tagName) {
    let msg = ``
    if (!componentType) {
      msg += `Received an empty component type. The element tag will default to a "div"`
    } else {
      msg += `None of the node types matched with "${componentType}". Perhaps it needs to be ' +
      'supported? (Defaulting to "div" instead)`
    }
    console.log(`%c${msg}`, 'color:#e74c3c;font-weight:bold;', {
      component,
      componentType,
      elementMap: getElementTag.prototype.elementMap,
    })
    return 'div'
  }

  return tagName
}

getElementTag.prototype.elementMap = {
  br: 'br',
  button: 'button',
  canvas: 'canvas',
  chart: 'div',
  date: 'input',
  dateSelect: 'input',
  divider: 'hr',
  ecosDoc: 'div',
  footer: 'div',
  header: 'div',
  searchBar: 'input',
  textField: 'input',
  image: 'img',
  label: 'div',
  list: 'ul',
  listItem: 'li',
  map: 'div',
  page: 'iframe',
  popUp: 'div',
  plugin: 'div',
  pluginHead: 'script',
  pluginBodyTail: 'script',
  register: 'div',
  scrollView: 'div',
  select: 'select',
  textView: 'textarea',
  video: 'video',
  view: 'div',
} as const

/**
 * Creates a function that queries for a DOM node.
 * This method searches through several window/document objects and is most
 * useful for page consumer components
 * @param { string } attr
 */
export function makeFindByAttr(
  attr: LiteralUnion<NOODLDOMDataAttribute, string>,
) {
  const findByAttr = function findByAttr(
    component?:
      | NUIComponent.Instance
      | LiteralUnion<NOODLDOMDataAttribute, string>,
  ) {
    if (component === undefined) return findBySelector(`[${attr}]`)
    else if (!component) return null
    return dataAttributes.includes(attr as NOODLDOMDataAttribute)
      ? findByDataAttrib(
          attr,
          isComponent(component)
            ? pullFromComponent(attr, component)
            : component,
        )
      : findBySelector(`[${attr}]`)
  }

  return findByAttr
}

export function findBySelector(selector = '') {
  return selector
    ? findElement((doc) => {
        let nodes = doc?.querySelectorAll?.(selector)
        if (nodes?.length) return nodes
        return null
      })
    : null
}

export function findFirstBySelector(
  ...args: Parameters<typeof findBySelector>
) {
  return u.array(findBySelector(...args)).find(Boolean) as HTMLElement
}

export function findByDataAttrib(
  dataAttrib: LiteralUnion<NOODLDOMDataAttribute, string> | undefined,
  value?: string,
) {
  return findBySelector(
    value ? `[${dataAttrib}="${value}"]` : `[${dataAttrib}]`,
  )
}
export const findByDataKey = makeFindByAttr('data-key')
export const findByGlobalId = makeFindByAttr('data-globalid')
export const findByPlaceholder = makeFindByAttr('data-placeholder')
export const findBySrc = makeFindByAttr('data-src')
export const findByViewTag = makeFindByAttr('data-viewtag')
export const findByUX = makeFindByAttr('data-ux')

export function findByClassName(className: string | undefined) {
  return findElement((doc) =>
    doc?.getElementsByClassName(u.isStr(className) ? className : ''),
  )
}

export function findByElementId(c: NUIComponent.Instance | string | undefined) {
  return findElement((doc) => doc?.getElementById(u.isStr(c) ? c : c?.id || ''))
}

export function getFirstByClassName<N extends HTMLElement = HTMLElement>(
  c: Parameters<typeof findByClassName>[0],
) {
  return u.array(asHtmlElement(findByClassName(c)))[0] as N
}

export function getFirstByDataKey<N extends HTMLElement = HTMLElement>(
  c: Parameters<typeof findByDataKey>[0],
) {
  return u.array(asHtmlElement(findByDataKey(c)))[0] as N
}

export function getFirstByElementId<N extends HTMLElement = HTMLElement>(
  c: Parameters<typeof findByElementId>[0],
) {
  return u.array(asHtmlElement(findByElementId(c)))[0] as N
}

export function getFirstByGlobalId<N extends HTMLElement = HTMLElement>(
  c: Parameters<typeof findByGlobalId>[0],
) {
  return u.array(asHtmlElement(findByGlobalId(c)))[0] as N
}

export function getFirstByViewTag<N extends HTMLElement = HTMLElement>(
  c: Parameters<typeof findByViewTag>[0],
) {
  return u.array(asHtmlElement(findByViewTag(c)))[0] as N
}

export function getFirstByUX<N extends HTMLElement = HTMLElement>(
  c: Parameters<typeof findByUX>[0],
) {
  return u.array(asHtmlElement(findByUX(c)))[0] as N
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
      nodeList.forEach((node: HTMLElement) => nodes.push(node))
      return nodes.length === 1 ? nodes[0] : nodes
    }
  }
  return null
}

/**
 * Returns the component instance of type: page if it exists in the parent ancestry tree
 * @param { NUIComponent.Instance } component
 */
export function getPageAncestor(
  component: NUIComponent.Instance | null | undefined,
) {
  if (isComponent(component)) {
    if (component.type === 'page') return component
    return findParent(component, (parent) => parent?.type === 'page')
  }
  return null
}

export function makeElemFn(fn: (node: HTMLElement) => void) {
  const onNodes = function _onNodes(nodes: DOMNodeInput, cb?: typeof fn) {
    let count = 0
    u.array(asHtmlElement(nodes)).forEach((node) => {
      if (node) {
        count++
        fn(node)
        cb?.(node)
      }
    })
    return count || false
  }
  return onNodes
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
 * @param { NUIComponent.Instance } component
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
