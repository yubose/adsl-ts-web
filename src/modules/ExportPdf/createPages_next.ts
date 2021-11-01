import * as u from '@jsmanifest/utils'
import jsPDF from 'jspdf'
import curry from 'lodash/curry'
import createCanvas from './createCanvas'
import getSnapObjects, {
  getSnapObject,
  getSnapObjectsBySibling,
  SnapObject,
} from './getSnapObjects'
import getPageElements from './getPageElements'
import isElement from '../../utils/isElement'
import linkNodes from './linkNodes'
import type { Item } from './types'
import getBounds from './getBounds'

export interface Options {
  format?: number[]
  orientation?: 'landscape' | 'portrait'
  pageWidth?: number
  pageHeight?: number
  overallWidth?: number
  overallHeight?: number
}

function getSiblings(node: HTMLElement) {
  const siblings = [] as HTMLElement[]
  let sibling = node
  while (sibling) {
    HTMLElement && siblings.push(sibling)
    sibling = node.nextElementSibling as HTMLElement
  }
  return siblings
}

async function createPages(
  pdf: jsPDF,
  el: HTMLElement | null | undefined,
  options?: Options,
) {
  try {
    if (!el) return pdf

    let overallHeight = el.scrollHeight
    let { width, height, y } = el.getBoundingClientRect()
    let {
      format = [width, height],
      orientation = 'portrait',
      pageWidth = window.innerWidth,
      pageHeight = window.innerHeight,
      overallWidth = pageWidth,
      // overallHeight = pageHeight,
    } = options || {}

    const isWillOverflow = (startPos: number, height: number, acc = 0) =>
      height + acc > startPos + height

    const isSelfOverflow = (pageHeight: number, el: HTMLElement) =>
      el.childElementCount == 0 &&
      el.getBoundingClientRect().height > pageHeight

    const getChildOverflowProps = (
      pageHeight: number,
      el: HTMLElement,
      currHeight = 0,
    ) => {
      let accHeight = el.getBoundingClientRect().height + currHeight

      if (el.children.length) {
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

    const getIdsAt = (nodes: HTMLElement[], start = 0, end = nodes.length) => {
      const ids = [] as string[]
      for (let i = start; i < end; i++) {
        const el = nodes[i]
        if (isElement(el)) ids.push(el.id)
      }
      return ids
    }

    const getPreviousSiblings = (
      acc: HTMLElement[] = [],
      el: HTMLElement | null | undefined,
    ): HTMLElement[] => {
      if (el?.previousElementSibling) {
        return acc.concat(
          el.previousElementSibling as HTMLElement,
          ...getPreviousSiblings(
            acc,
            el.previousElementSibling.previousElementSibling as HTMLElement,
          ),
        )
      }
      return acc
    }

    // const getSnapObjects = curry(
    //   (
    //     pageHeight: number = 0,
    //     snapObjects: SnapObject[][] = [],
    //     currList: SnapObject[] = [],
    //     el: HTMLElement,
    //     startPos = 0,
    //     pos = 0,
    //     acc = 0, // Accumulated height
    //   ) => {
    //     const obj = getSnapObject(el, pos)
    //     const nextHeight = obj.height + acc
    //     const nextPosition = obj.height + pos

    //     if (isWillOverflow(startPos, obj.height, acc)) {
    //       if (isSelfOverflow(pageHeight, el)) {
    //         return snapObjects.concat(currList, [getSnapObject(el, startPos)])
    //       } else {
    //         const childOverflowProps = getChildOverflowProps(
    //           pageHeight,
    //           el,
    //           acc,
    //         )
    //         if (u.isObj(childOverflowProps)) {
    //           const { node } = childOverflowProps
    //           if (!obj.hide) obj.hide = {}
    //           if (!obj.hide.children) obj.hide.children = []
    //           const prevSiblingSnapObjects = getSnapObjectsBySibling(
    //             node,
    //             pos,
    //             'previous',
    //           )
    //           // Remove the first node since we are including it in the upcoming list
    //           prevSiblingSnapObjects.shift()
    //           currList.push(...prevSiblingSnapObjects)
    //           currList = getSnapObjectsBySibling(node, pos)
    //           currList.shift()

    //           return getSnapObjects(
    //             pageHeight,
    //             snapObjects.concat(currList),
    //             currList,
    //             node,
    //             obj.start.position,
    //             (acc += u.reduce(
    //               prevSiblingSnapObjects,
    //               (acc = 0, obj) => acc + obj.height,
    //               0,
    //             )),
    //           )
    //         } else if (!childOverflowProps) {
    //           currList.push(obj)
    //         }
    //       }
    //     } else {
    //       return getSnapObjects(pageHeight)
    //     }

    //     return snapObjects
    //   },
    // )

    if (height < overallHeight) {
      if (isElement(el.firstElementChild)) {
        let snapObjectsList = [] as SnapObject[][]
        let position = 0
        let accumulatedHeight = 0
        let currPageHeight = 0

        // Will be creating multiple pages
        if (overallHeight > pageHeight) {
          /**
           * Retrieve a list of snap objects where we will make each entry a pdf page
           *
           * Find which element will overflow in two ways:
           *    1. Visit the children
           *    2. Visit the siblings
           */
          if (el.children.length) {
            let results: SnapObject[] = []

            for (const childNode of el.children) {
              if (isElement(childNode)) {
                const obj = getSnapObject(childNode, position)

                // This element block itself will overflow a pdf page
                if (obj.height > pageHeight) {
                  if (childNode.children.length) {
                    // Find the first child that begins overflowing
                    let node = childNode.children[0]
                    let acc = 0

                    while (node) {
                      const height = node.getBoundingClientRect().height
                      const nextHeight = acc + height
                      if (nextHeight > pageHeight) {
                        // This child is the one overflowing
                        if (!obj.hide) obj.hide = {}
                        if (!obj.hide.children) obj.hide.children = []
                        obj.hide.children.push(node.id)
                        snapObjectsList.push(results)
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
                else if (currPageHeight + obj.height > pageHeight) {
                  if (!obj.hide) obj.hide = {}
                  if (!obj.hide.children) obj.hide.children = []
                  obj.hide.children.push(childNode.id)

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
                  snapObjectsList.push(results)
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
            snapObjectsList.push([getSnapObject(el, position)])
          }
        } else {
          snapObjectsList.push([getSnapObject(el, position)])
        }

        for (const snapObjects of snapObjectsList) {
          let canvas = await createCanvas({
            container: el,
            items: snapObjects,
            width,
            height,
            pageHeight,
            options: {
              windowWidth: overallWidth,
              windowHeight: overallHeight,
            },
          })

          pdf.addPage(format, orientation)
          pdf.addImage(canvas, 'PNG', 0, 0, pageWidth, pageHeight)
        }
      } else {
        const canvas = await html2canvas(el, { width, height })
        pdf.addPage(format, orientation)
        pdf.addImage(canvas, 'PNG', 0, 0, width, height)
      }
    } else {
      pdf.addPage(format, orientation)
      await pdf.html(el, {
        autoPaging: true,
        width,
      })
      // const canvas = await html2canvas(el, { width, height })
      // pdf.addPage(format, orientation)
      // pdf.addImage(canvas, 'PNG', 0, 0, width, height)
    }

    return pdf
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error(String(error))
  }
}

export default createPages
