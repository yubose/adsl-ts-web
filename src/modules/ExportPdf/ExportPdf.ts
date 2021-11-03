import jsPDF from 'jspdf'
import createCanvas from './createCanvas'
import ExportNode from './ExportNode'
import getBounds from './getBounds'
import {
  createExportNode,
  forEachChildrenToPdfExportNodes,
  mapChildrenToPdfExportNodes,
  getChildOverflowProps,
  getFirstElement,
  getNextElementSiblings,
  getPreviousElementSiblings,
  getPreviousSiblingExportNodes,
  getNextSiblingExportNodes,
  getSiblings,
  isSelfOverflow,
  toHtmlElementsArray,
  willOverflow,
} from './utils'
import * as t from './types'

const isNil = (v: unknown): v is null | undefined => v == null || v == undefined

// function findChildNode(cb: (child: HTMLElement, index: number, coll: HTMLElement[]) => child is HTMLElement, el: HTMLElement | null | undefined) {
//   if (el) {
//     return ([...el.children] as HTMLElement[]).find<HTMLElement>(cb)
//   }
//   return null
// }

export const ExportPdf = (function () {
  let _settings: t.Settings = {
    orientation: 'portrait',
    overallWidth: 0,
    overallHeight: 0,
    pageHeight: 0,
    pageWidth: 0,
    pdf: null,
  }

  async function createPages(pdf: jsPDF, el: HTMLElement | null | undefined) {
    try {
      if (!el) return pdf
      let { width, height } = el.getBoundingClientRect()
      let format = [_settings.pageWidth, _settings.pageHeight]

      if (height < _settings.overallHeight) {
        let acc = 0
        let currPageHeight = 0
        let nodesList = [] as ExportNode[][]
        let position = 0

        // Will be creating multiple pages
        if (_settings.overallHeight > _settings.pageHeight) {
          /**
           * Retrieve a list of snap objects where we will make each entry a pdf page
           *
           * Find which element will overflow in two ways:
           *    1. Visit the children
           *    2. Visit the siblings
           */
          if (el.childElementCount) {
            let results: ExportNode[] = []
            forEachChildrenToPdfExportNodes(
              (xnode, index, children) => {
                // This element will overflow further than a page
                if (xnode.height > _settings.pageHeight) {
                  if (xnode.el?.children?.length) {
                    // Find the first child that begins overflowing
                    let innerNode = xnode.el?.children?.[0]

                    while (innerNode) {
                      const height = innerNode.getBoundingClientRect().height
                      const nextHeight = acc + height
                      if (nextHeight > _settings.pageHeight) {
                        // This child is the one overflowing
                        xnode.hidden.push(innerNode.id as string)
                        // TODO - Split the children between two lists of snap objects where the first one is merging into current snap objects
                        nodesList.push(results)
                        position += acc
                        // Take this childNode and all of its siblings and let them be the start of a separate entry (separate page)
                        results = getSiblings(
                          'right',
                          innerNode,
                          position,
                        ).reduce((arr, el) => {
                          debugger
                          return arr.concat(el)
                        }, [] as ExportNode[])
                        break
                      } else if (xnode.height == 0) {
                        results.push(xnode)
                        continue
                      }
                      acc += xnode.height
                      innerNode = innerNode.nextElementSibling as HTMLElement
                    }
                  } else {
                    results.push(xnode)
                  }
                }
                // Blank node
                else if (xnode.height == 0) {
                  results.push(xnode)
                }
                // A child within will overflow
                else if (currPageHeight + xnode.height > _settings.pageHeight) {
                  xnode.hidden.push(xnode.el?.id as string)

                  //

                  // let middleHeadNode: HTMLElement | undefined
                  // let numChildren = xnode.el?.childElementCount || 0
                  // let tempHeight = 0

                  // for (let index = 0; index < numChildren; index++) {
                  //   const node = xnode.el?.children[index] as HTMLElement
                  //   const height = node.getBoundingClientRect().height
                  //   if (tempHeight + height > currPageHeight) {
                  //     middleHeadNode = node
                  //     break
                  //   }
                  //   tempHeight += height
                  // }

                  // if (middleHeadNode) {
                  //   results.push(
                  //     ...mapChildrenToPdfExportNodes(
                  //       (node, index, coll) => node,
                  //       (middleHeadNode.previousElementSibling as HTMLElement) ||
                  //         middleHeadNode,
                  //     ),
                  //   )
                  // } else {
                  //   middleHeadNode = xnode.el?.children[0] as HTMLElement
                  // }

                  //

                  // TODO - Split the children between two lists of snap objects where the first one is merging into current snap objects
                  nodesList.push(results)
                  // Take this childNode and all of its siblings and let them be the start of a separate entry (separate page)
                  results = getSiblings(
                    'right',
                    el.children[index],
                    position,
                  ).reduce((arr, el) => {
                    debugger
                    return arr.concat(el)
                  }, [] as ExportNode[])
                  currPageHeight = 0
                  return
                } else {
                  results.push(xnode)
                }

                currPageHeight += xnode.height
                position += xnode.height
                acc += xnode.height
              },
              el.children,
              position,
            )
          } else {
            debugger
            nodesList.push([createExportNode(el, position)])
          }
        } else {
          debugger
          nodesList.push([createExportNode(el, position)])
        }

        for (const xnodes of nodesList) {
          xnodes[0]?.el?.scrollIntoView?.()
          console.log(xnodes)
          let canvas = await createCanvas({
            container: el,
            items: xnodes,
            width,
            height,
            pageHeight: _settings.pageHeight,
            options: {
              scrollY: position,
              windowWidth: _settings.pageWidth,
              windowHeight: _settings.pageHeight,
            },
          })

          pdf.addPage(format, _settings.orientation)
          pdf.addImage(
            canvas,
            'PNG',
            0,
            0,
            _settings.pageWidth,
            _settings.pageHeight,
          )
        }
      } else {
        pdf.addPage(format, _settings.orientation)
        await pdf.html(el, {
          autoPaging: true,
          width,
        })
      }

      return pdf
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error(String(error))
    }
  }

  const o = {
    createExportNode,
    createPages,
    forEachChildrenToPdfExportNodes,
    getBounds,
    getChildOverflowProps,
    getFirstElement,
    getPreviousElementSiblings,
    getNextElementSiblings,
    getPreviousSiblingExportNodes,
    getNextSiblingExportNodes,
    isSelfOverflow,
    mapChildrenToPdfExportNodes,
    settings: _settings,
    toHtmlElementsArray,
    willOverflow,
  }

  window['ExportPdf'] = o

  return function makeExportPdf(settings: Partial<t.Settings> = {}) {
    if (!isNil(settings.pageWidth)) _settings.pageWidth = settings.pageWidth
    if (!isNil(settings.pageHeight)) _settings.pageHeight = settings.pageHeight
    if (!isNil(settings.orientation))
      _settings.orientation = settings.orientation
    if (!isNil(settings.overallWidth))
      _settings.overallWidth = settings.overallWidth
    if (!isNil(settings.overallHeight))
      _settings.overallHeight = settings.overallHeight

    if (typeof window !== 'undefined') {
      if (isNil(settings.pageWidth)) _settings.pageWidth = window.innerWidth
      if (isNil(settings.pageHeight)) _settings.pageHeight = window.innerHeight
      if (isNil(settings.overallWidth))
        _settings.overallWidth = window.innerWidth
      if (isNil(settings.overallHeight))
        _settings.overallHeight = window.innerHeight
    }

    return o
  }
})()

export default ExportPdf
