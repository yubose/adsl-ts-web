import * as u from '@jsmanifest/utils'
import curry from 'lodash/curry'
import getBounds from './getBounds'
import isElement from '../../utils/isElement'
import isNodeList from '../../utils/isNodeList'
import ExportNode from './ExportNode'
import * as t from './types'

export function createExportNode(el: HTMLElement, pos = 0) {
  const bounds = getBounds(el, pos)
  const node = new ExportNode(el, { metadata: true })
  node.start = bounds.start
  node.end = bounds.end
  return node
}

/**
 * Returns an object containing the first encountered child element that will overflow to the next along with its index and the id
 * @param el HTML Element
 * @param currHeight
 * @returns { false | { node: HTMLElement; index: number; id: string } }
 */
export function getChildOverflowProps(
  pageHeight: number,
  el: HTMLElement,
  currHeight = 0,
) {
  let accHeight = el.getBoundingClientRect().height + currHeight

  if (el.children?.length) {
    for (let i = 0; i < el.childElementCount; i++) {
      const node = el.children[i]
      if (isElement(node)) {
        if (accHeight >= pageHeight) {
          return {
            node,
            index: i,
            id: node.id,
          }
        }
      }
      accHeight += node.getBoundingClientRect().height
    }
  }

  return false
}

export function getFirstElement(el: t.ElementArg) {
  if (isNodeList(el)) return el.item(0) as HTMLElement
  return Array.isArray(el) ? el[0] : el
}

export const getSiblings = curry(
  (
    direction: 'left' | 'right',
    el: t.ElementArg,
    pos: number = 0,
  ): ExportNode[] => {
    let elems = [] as ExportNode[]

    if (el) {
      let fnName =
        direction === 'left' ? 'previousElementSibling' : 'nextElementSibling'
      let sibling = el[fnName] as HTMLElement | null
      while (sibling) {
        elems.push(createExportNode(sibling, pos))
        // return elems.concat(sibling, ...getSiblings(direction, sibling, pos))
        sibling = sibling?.[fnName]
      }
    }
    return elems
  },
)

export const getPreviousElementSiblings = getSiblings('left')
export const getNextElementSiblings = getSiblings('right')

export function getSiblingExportNodes(
  acc: ExportNode[] = [],
  el: HTMLElement | null | undefined,
  direction: 'left' | 'right' = 'right',
  pos = 0,
) {
  if (!el) return [] as ExportNode[]

  const method = `${direction === 'left' ? 'previous' : 'next'}ElementSibling`
  const node = createExportNode(el[method], pos)

  return el[method]
    ? acc.concat(
        node,
        ...getSiblingExportNodes(
          acc,
          el[method]?.[method],
          direction,
          node.start,
        ),
      )
    : acc
}

export function getPreviousSiblingExportNodes(
  el: HTMLElement | null | undefined,
  pos = 0,
) {
  return getSiblingExportNodes([], el, 'left', pos)
}

export function getNextSiblingExportNodes(
  el: HTMLElement | null | undefined,
  pos = 0,
) {
  return getSiblingExportNodes([], el, 'right', pos)
}

export function toHtmlElementsArray(el: t.ElementArg): HTMLElement[] {
  if (!el) return []
  if (isElement(el)) return [el]
  if (isNodeList(el)) return [...el] as HTMLElement[]
  return []
}

/* -------------------------------------------------------
  ---- EXPORT NODE UTILITIES (after transformation)
-------------------------------------------------------- */

export function forEachChildrenToPdfExportNodes(
  cb: (node: ExportNode, index: number, coll: HTMLElement[]) => void = () => {},
  children: Parameters<typeof mapChildrenToPdfExportNodes>[1],
  pos = 0,
) {
  if (children) {
    mapChildrenToPdfExportNodes(
      (node, index, coll) => {
        cb(node, index, coll)
        return node
      },
      (isNodeList(children)
        ? [...children]
        : u.array(children)) as HTMLElement[],
      pos,
    )
  }
}

export function mapChildrenToPdfExportNodes(
  cb: (node: ExportNode, index: number, coll: HTMLElement[]) => ExportNode = (
    n,
  ) => n,
  children: t.ElementArg,
  pos = 0,
) {
  if (!children) return []

  const elements = (
    isNodeList(children) ? [...children] : u.array(children)
  ) as HTMLElement[]
  const childrenExports = [] as ExportNode[]
  const numChildren = elements.length

  for (let i = 0; i < numChildren; i++) {
    const el = elements[i] as HTMLElement
    const node = createExportNode(el, pos)
    childrenExports.push(cb(node, i, elements))
  }

  return childrenExports
}

/**
 * Returns true if the element does not have children but contains content that span multiple pages
 * @param el HTML Element
 */
export function isSelfOverflow(pageHeight: number, el: HTMLElement) {
  return (
    el.childElementCount == 0 && el.getBoundingClientRect().height > pageHeight
  )
}

/**
 * Returns true if an element or object with the given height will flow to the next page
 * @param start Start position
 * @param height
 * @param acc Accumulated height
 * @returns
 */
export function willOverflow(start: number, height: number, acc = 0) {
  return height + acc > start + height
}
