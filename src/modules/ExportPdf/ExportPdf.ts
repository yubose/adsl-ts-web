import createCanvas from './createCanvas'
import createePages from './createPages'
import getBounds from './getBounds'
import getSnapObjects from './getSnapObjects'
import isElement from '../../utils/isElement'
import visit from './visit'
import * as t from './types'
import jsPDF from 'jspdf'

const isNil = (v: unknown): v is null | undefined => v == null || v == undefined
const isNum = (v: unknown): v is number => typeof v === 'number'

function getSnapObjectsBySibling(
  el: HTMLElement,
  pos = 0,
  type: 'previous' | 'next' = 'next',
) {
  let objs = [] as t.SnapObject[]
  let obj = getSnapObject(el, pos)
  let method =
    type === 'previous' ? 'previousElementSibling' : 'nextElementSibling'

  objs.push(obj)

  let currSibling = el[method] as HTMLElement

  while (currSibling) {
    const snapObject = getSnapObject(currSibling, pos)
    objs.push(snapObject)
    pos += snapObject.height
    currSibling = currSibling[method] as HTMLElement
  }

  return objs
}

function getSnapObject(el: HTMLElement, pos: number) {
  const bounds = getBounds(el, pos)
  return {
    start: {
      position: pos,
      node: el,
    },
    end: {
      position: bounds.end,
      node: el,
    },
    height: bounds.height,
    native: bounds.native,
    text: el.textContent?.substring?.(0, 35) || '',
  } as t.SnapObject
}

class Node {
  el: HTMLElement | null
  start = 0
  end = 0
  hidden = [] as string[]
  nativeBounds: DOMRect;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toJSON()
  }

  constructor(el: HTMLElement) {
    this.el = el
    this.nativeBounds = this.el.getBoundingClientRect()
  }

  get bounds() {
    return this.el ? getBounds(this.el, this.start) : null
  }

  get height() {
    return this.nativeBounds.height
  }

  toJSON() {
    return {
      bounds: this.bounds,
      nativeBounds: this.nativeBounds,
      el: this.el,
      start: this.start,
      end: this.end,
      height: this.height,
    }
  }
}

class ExportPdf {
  pdf: jsPDF | null = null
  pageWidth: number = 0
  pageHeight: number = 0
  orientation: t.Orientation = 'portrait'
  overallWidth: number = 0
  overallHeight: number = 0

  constructor(options: t.Options = {}) {
    if (!isNil(options.pageWidth)) this.pageWidth = options.pageWidth
    if (!isNil(options.pageHeight)) this.pageHeight = options.pageHeight
    if (!isNil(options.orientation)) this.orientation = options.orientation
    if (!isNil(options.overallWidth)) this.overallWidth = options.overallWidth
    if (!isNil(options.overallHeight)) this.pageHeight = options.overallHeight

    if (typeof window !== 'undefined') {
      if (isNil(this.pageWidth)) this.pageWidth = window.innerWidth
      if (isNil(this.pageHeight)) this.pageHeight = window.innerHeight
      if (isNil(this.overallWidth)) this.overallWidth = this.pageWidth
      if (isNil(this.overallHeight)) this.overallHeight = this.pageHeight
    }
  }

  createNode(el: HTMLElement, pos = 0) {
    const bounds = getBounds(el, pos)
    const node = new Node(el)
    node.start = bounds.start
    node.end = bounds.end
    return node
  }

  createNodesbySibling(el: HTMLElement)

  async createPages(pdf: jsPDF, el: HTMLElement | null | undefined) {
    if (!el) return pdf

    let { width, height } = el.getBoundingClientRect()
    let format = [width, height]
    let nodesList = [] as Node[][]
    let accumulatedHeight = 0
    let position = 0
    let currPageHeight = 0

    // Will be creating multiple pages
    if (this.overallHeight > this.pageHeight) {
      /**
       * Retrieve a list of snap objects where we will make each entry a pdf page
       *
       * Find which element will overflow in two ways:
       *    1. Visit the children
       *    2. Visit the siblings
       */
      if (el.children.length) {
        let results: Node[] = []

        for (const childNode of el.children) {
          if (isElement(childNode)) {
            const obj = this.createNode(childNode, position)

            // This element block itself will overflow a pdf page
            if (obj.height > this.pageHeight) {
              if (childNode.children.length) {
                // Find the first child that begins overflowing
                let node = childNode.children[0]
                let acc = 0

                while (node) {
                  const height = node.getBoundingClientRect().height
                  const nextHeight = acc + height
                  if (nextHeight > this.pageHeight) {
                    // This child is the one overflowing
                    obj.hidden.push(node.id)
                    nodesList.push(results)
                    position += acc
                    // Take this childNode and all of its siblings and let them be the start of a separate entry (separate page)
                    results = getSnapObjectsBySibling(
                      node as HTMLElement,
                      position,
                    )
                    break
                  }
                  acc += height
                  node = node.nextElementSibling as HTMLElement
                }
              } else {
                results.push(obj)
                continue
              }
            } else if (obj.height == 0) {
              results.push(obj)
              continue
            }
            // A child within will overflow
            else if (currPageHeight + obj.height > this.pageHeight) {
              obj.hidden.push(childNode.id)

              //

              let middleHeadNode: HTMLElement | undefined
              let numChildren = childNode.childElementCount
              let tempHeight = 0

              for (let index = 0; index < numChildren; index++) {
                const node = childNode.children[index] as HTMLElement
                const height = node.getBoundingClientRect().height
                if (tempHeight + height > currPageHeight) {
                  middleHeadNode = node
                  break
                }
                tempHeight += height
              }
              if (middleHeadNode) {
                results.push(
                  ...getSnapObjectsBySibling(
                    (middleHeadNode.previousElementSibling as HTMLElement) ||
                      middleHeadNode,
                    position,
                    'previous',
                  ),
                )
              } else {
                middleHeadNode = childNode.children[0] as HTMLElement
              }

              //

              // TODO - Split the children between two lists of snap objects where the first one is merging into current snap objects
              nodesList.push(results)
              // Take this childNode and all of its siblings and let them be the start of a separate entry (separate page)
              results = getSnapObjectsBySibling(
                middleHeadNode,
                position + tempHeight,
              )
              currPageHeight = 0
              continue
            } else {
              results.push(obj)
            }
            currPageHeight += obj.height
            position += obj.height
            accumulatedHeight += obj.height
          }
        }
      } else {
        nodesList.push([this.createNode(el, position)])
      }
    }
  }

  /**
   * Returns true if an element or object with the given height will flow to the next page
   * @param start Start position
   * @param height
   * @param acc Accumulated height
   * @returns
   */
  willOverflow(start: number, height: number, acc = 0) {
    return height + acc > start + height
  }

  /**
   * Returns true if the element does not have children but contains content that span multiple pages
   * @param el HTML Element
   */
  isSelfOverflow(el: HTMLElement) {
    return (
      el.childElementCount == 0 &&
      el.getBoundingClientRect().height > this.pageHeight
    )
  }

  /**
   * Returns an object containing the first encountered child element that will overflow to the next along with its index and the id
   * @param el HTML Element
   * @param currHeight
   * @returns { false | { node: HTMLElement; index: number; id: string } }
   */
  getChildOverflowProps(el: HTMLElement, currHeight = 0) {
    let accHeight = el.getBoundingClientRect().height + currHeight

    if (el.children.length) {
      for (let i = 0; i < el.childElementCount; i++) {
        const node = el.children[i]
        if (isElement(node)) {
          if (accHeight >= this.pageHeight) {
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

  getSiblingNodes(
    acc: Node[] = [],
    el: HTMLElement | null | undefined,
    direction: 'left' | 'right' = 'right',
  ) {
    if (!el) return [] as Node[]

    const method = `${direction === 'left' ? 'previous' : 'next'}ElementSibling`
    const node = this.createNode(el[method], pos)

    return el[method]
      ? acc.concat(
          node,
          ...this.getSiblingNodes(
            acc,
            el[method]?.[method],
            node.end,
            direction,
          ),
        )
      : acc
  }

  getPreviousSiblingNodes(el: HTMLElement | null | undefined) {
    return this.getSiblingNodes([], el, 'left')
  }

  getNextSiblingNodes(el: HTMLElement | null | undefined) {
    return this.getSiblingNodes([], el)
  }
}

export default ExportPdf
