import * as u from '@jsmanifest/utils'
import isElement from './isElement'

export interface ElementTreeDimensions {
  bounds: DOMRect
  id: string
  children: any[]
  clientHeight: number
  offsetHeight: number
  scrollHeight: number
  style?: {
    position?: string | undefined
    display?: string | undefined
    marginTop?: string | undefined
    top?: string | undefined
    left?: string | undefined
    width?: string | undefined
    height?: string | undefined
  }
  parent: string
  path: (string | number)[]
  src?: string
  viewTag?: string
}

function getElementTreeDimensions(el: HTMLElement | null | undefined) {
  const obj = {} as ElementTreeDimensions
  if (!el) return obj

  function getProps(obj: ElementTreeDimensions, el: HTMLElement) {
    const result = {
      ...obj,
      bounds: el.getBoundingClientRect(),
      id: el.id,
      clientHeight: el.clientHeight,
      offsetHeight: el.offsetHeight,
      scrollHeight: el.scrollHeight,
      style: {
        position: el.style.position,
        display: el.style.display,
      },
    } as ElementTreeDimensions

    for (const key of [
      'display',
      'marginTop',
      'top',
      'left',
      'width',
      'height',
    ]) {
      el.style[key] && result.style && (result.style[key] = el.style[key])
    }
    if (el.dataset.src) {
      result.src = el.dataset.src
    }
    if (el.dataset.viewtag) {
      result.viewTag = el.dataset.viewtag
    }
    return result
  }

  u.assign(obj, getProps(obj, el), {
    children: [],
    path: [],
    parent: null,
  })

  function collect(obj = {} as ElementTreeDimensions, node: Element | null) {
    if (isElement(node)) {
      u.assign(obj, getProps(obj, node))
      const numChildren = node.children.length
      numChildren && !obj.children && (obj.children = [])
      for (let index = 0; index < numChildren; index++) {
        const childNode = node.children[index]
        !obj.children && (obj.children = [])
        obj.children[index] = collect(
          {
            parent: node.id,
            path: obj.path?.concat?.('children', index) || ['children', index],
          } as ElementTreeDimensions,
          childNode,
        )
      }
    }
    return obj
  }

  const numChildren = el.children.length
  numChildren && !obj.children && (obj.children = [])
  for (let index = 0; index < numChildren; index++) {
    const childNode = el.children[index]
    !obj.children && (obj.children = [])
    obj.children[index] = collect(
      {
        parent: el.id,
        path: obj.path?.concat(`children`, index) || [`children`, index],
      } as ElementTreeDimensions,
      childNode,
    )
  }

  return obj
}

export default getElementTreeDimensions
