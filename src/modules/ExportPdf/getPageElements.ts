import * as u from '@jsmanifest/utils'
import isElement from '../../utils/isElement'
import linkNodes, { NodeLink } from './linkNodes'
import type { Item } from './types'
import getBounds from './getBounds'

/**
 *
 * @param { HTMLElement } el - The first sibling element. This should always be the first element to be in the output (a.k.a position will always be at 0 at start)
 * @param pageHeight
 * @returns { Item[] }
 */
export function getPageElements(
  el: NodeLink,
  pageHeight: number,
  startPosition = 0,
) {
  let items = [] as Item[]
  let position = startPosition
  let sibling: HTMLElement
  let first: Item | undefined
  let last: Item | undefined
  let scrollY = 0
  let totalHeight = 0
  let hasInnerLast = false

  if (el) {
    let linkedNode = el as NodeLink | null
    sibling = linkedNode?.node as HTMLElement
    scrollY = getBounds(sibling, position).start

    while (sibling) {
      let { start, end, height } = getBounds(sibling, position)

      let item: Item = {
        start,
        end,
        height,
        id: sibling.id,
        text: sibling.textContent || '',
        node: sibling,
        hide: {
          self: false,
          children: [],
        },
      }

      // !items.length && items.push(item)
      first === undefined && (first = item)

      // If the element is bigger than the page, we must split the children that is beyond the page and put them into a queue for the next page
      if (height > pageHeight) {
        // let currHeight = 0
        // let childLast: Item | undefined
        // for (const child of sibling.children) {
        //   if (isElement(child)) {
        //     const bounds = getBounds(child, position)
        //     currHeight += bounds.height
        //     const childItem = {
        //       ...bounds,
        //       id: child.id,
        //       text: child.textContent || '',
        //       node: child,
        //     }
        //     if (bounds.end <= pageHeight + startPosition) {
        //       // items.push(childItem)
        //       position = bounds.end
        //
        //     } else if (end >= pageHeight) {
        //
        //       if (!childLast) childLast = childItem
        //       if (!item.hide.includes(child.id)) {
        //         item.hide.push(child.id)
        //       }
        //     }
        //   }
        // }
        // hasInnerLast = true
        // last = childLast
        // totalHeight += currHeight
      } else {
        // totalHeight += height
      }

      totalHeight += height

      if (end <= pageHeight + startPosition) {
        items.push(item)
        position = end
      } else if (end > startPosition + pageHeight) {
        if (!items.length) items.push(item)

        // if (!item.hide.includes(item.id)) item.hide.push(item.id)
        if (sibling.children?.length) {
          let currHeight = 0
          for (const child of sibling.children) {
            const bounds = getBounds(child, position)
            currHeight += bounds.height

            if (currHeight + position > pageHeight) {
              if (!item.hide.children.includes(child.id)) {
                item.hide.children.push(child.id)
              }
              const childItem = {
                ...bounds,
                id: child.id,
                text: child.textContent || '',
                hide: { self: true, children: [] },
                node: child as HTMLElement,
              }
              hasInnerLast = true
              last = childItem
            }
          }
        } else {
          //
        }
        return {
          items,
          first,
          last: hasInnerLast ? last : item,
          scrollY,
          totalHeight,
          linkedNode,
        }
      }
      linkedNode = linkedNode?.next as NodeLink
      sibling = linkedNode?.node
    }
  }

  return {
    items,
    first,
    last,
    scrollY,
    totalHeight,
  }
}

export default getPageElements
