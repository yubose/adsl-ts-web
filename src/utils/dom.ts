import * as u from '@jsmanifest/utils'
import type jsPDF from 'jspdf'
import { asHtmlElement, findByDataKey, makeElemFn } from 'noodl-ui-dom'
import { Options as Html2CanvasOptions } from 'html2canvas'
import { Viewport as NuiViewport } from 'noodl-ui'
import { createToast, Toast } from 'vercel-toast'
import { FileSelectorResult, FileSelectorCanceledResult } from '../app/types'
import { isDataUrl } from './common'
import {
  createCanvas as createCanvasForExportToPDF,
  getPageElements as getPageElementsForExportToPDF,
} from './exportToPDF'
import isElement from './isElement'

export function copyToClipboard(value: string) {
  const textarea = document.createElement('textarea')
  textarea.value =
    typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  document.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange(0, 9999999)
  document.execCommand('copy')
  textarea.remove()
  return null
}

export function isHtmlElement(node: Node): node is HTMLElement {
  return node.nodeType === Node.ELEMENT_NODE && 'style' in node
}

export function download(url: string | Blob, filename?: string) {
  let downloadLink = ''
  try {
    let a = document.createElement('a')

    if (u.isStr(url)) {
      downloadLink = url
    } else if (url instanceof Blob) {
      downloadLink = window.URL.createObjectURL(url)
    }

    downloadLink && (a.href = downloadLink)

    // Attempt to default to the original file name
    if (!filename) {
      // a.download =
    } else {
      a.download = filename
    }

    a.click()
  } catch (error) {
    throw error
  }
}

export function exportToPDF(
  {
    data,
    download: shouldDownload = false,
    labels = true,
    open = false,
    filename = 'file.pdf',
    viewport = { width: window.innerWidth, height: window.innerHeight },
  }: {
    data:
      | string
      | { title?: string; content?: string; data?: string }
      | HTMLElement
    download?: boolean
    labels?: boolean
    open?: boolean
    filename?: string
    viewport?: NuiViewport | { width: number; height: number }
  } = { data: '' },
): Promise<jsPDF> {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data) reject(new Error(`Cannot export from empty data`))

      filename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`

      const getImageDataUrlProps = (
        dataURL: string,
      ): Promise<{
        img: HTMLImageElement
        width: number
        height: number
        orientation: 'landscape' | 'portrait'
      }> => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.style.visibility = 'hidden'
          img.src = dataURL

          img.addEventListener('load', async function () {
            const width = img.naturalWidth
            const height = img.naturalHeight
            document.body.removeChild(img)
            resolve({
              img,
              width,
              height,
              orientation: width > height ? 'landscape' : 'portrait',
            })
          })

          img.addEventListener('error', function (err) {
            document.body.removeChild(img)
            reject(err)
          })

          document.body.appendChild(img)
        })
      }

      const createDocByDataURL = async (
        dataURL: string,
      ): Promise<jsPDF | null> => {
        if (u.isStr(dataURL)) {
          if (isDataUrl(dataURL) || dataURL.startsWith('http')) {
            const { img, width, height, orientation } =
              await getImageDataUrlProps(dataURL)
            const doc = new jspdf.jsPDF({
              compress: true,
              orientation,
              unit: 'px',
              format: [width, height],
            })
            doc.addImage(img, 'png', 0, 0, width, height)
            doc.viewerPreferences({ FitWindow: true }, true)
            return doc
          } else {
            throw new Error(
              `Tried to add an image to a PDF document but the data string was not a data uri. Only data uris are supported at the moment`,
            )
          }
        }
        return null
      }

      const createDocByDOMNode = async (node: HTMLElement): Promise<jsPDF> => {
        try {
          const bounds = node.getBoundingClientRect()
          const originalScrollPos = 0
          const overallHeight = node.scrollHeight
          const overallWidth = node.scrollWidth
          const width = NuiViewport.toNum(node.style.width)
          const height = NuiViewport.toNum(node.style.height)
          const orientation = width > height ? 'landscape' : 'portrait'
          const format = [width, height]
          const pageWidth = window.innerWidth
          const pageHeight = window.innerHeight

          console.log('\n')
          console.log({ pageWidth, pageHeight, overallHeight })

          const doc = await createPages(null, [node], {
            format,
            orientation,
            pageWidth: viewport.width,
            pageHeight: viewport.height,
          })

          // Deletes the empty page
          doc.deletePage(1)

          if (node.childElementCount) {
            let childNode = node.firstElementChild

            if (isElement(childNode)) {
              let items = getPageElementsForExportToPDF(childNode, pageHeight)
              let batchHeight = items.reduce(
                (acc, { height }) => (acc += height),
                0,
              )

              while (items.length) {
                let scrollY = 0
                let idToScrollTo = items[0]?.id || ''

                let nodeToScrollTo = !!(idToScrollTo && idToScrollTo !== '#')
                  ? (node.querySelector(`#${idToScrollTo}`) as HTMLElement)
                  : undefined

                if (nodeToScrollTo) {
                  let { tagName, id } = nodeToScrollTo
                  scrollY = getElementTop(nodeToScrollTo)
                  console.log(
                    `%c[${id}] Scrolling to ${tagName} element at scrollY: ${scrollY}`,
                    `color:hotpink;font-weight:bold;;`,
                  )
                  nodeToScrollTo.scrollIntoView()
                  nodeToScrollTo.style.border = `4px dashed hotpink`
                  debugger
                  // nodeToScrollTo.style.border = `none`
                } else {
                  console.log(`%cNo element to scroll to`, `color:#ec0000;`, {
                    scrollY,
                    idToScrollTo,
                    items,
                    childNode,
                  })
                }

                let canvas = await createCanvasForExportToPDF(node, items, {
                  scrollY,
                  width: pageWidth,
                  height: batchHeight,
                  windowWidth: overallWidth,
                  windowHeight: overallHeight,
                } as Html2CanvasOptions)

                doc.addPage(format, orientation)
                doc.addImage(canvas, 'PNG', 0, 0, pageWidth, pageHeight)

                const lastItem = items[items.length - 1]
                const lastChildId = lastItem.id
                const endPosition = lastItem.start

                if (lastChildId) {
                  debugger
                  items = getPageElementsForExportToPDF(
                    node.querySelector(`#${lastChildId}`) as HTMLElement,
                    pageHeight,
                    endPosition + lastItem.height,
                  )
                  debugger
                } else {
                  items.length = 0
                  break
                }
              }
            }

            // const canvases = await createCanvasForExportToPDF(node, items)
            // for (const canvas of canvases) {
            //   debugger
            //   doc.addPage(format, orientation)
            //   doc.addImage(canvas, 'PNG', 0, 0, canvas.width, canvas.height)
            // }
            // let currPageHeight = 0
            // let currHeight = 0
            // let firstPageNode: HTMLElement | undefined
            // let counter = 0

            // let lastId = ''
            // let pendingIds = [] as string[]
            // let queue = [...node.children].map((n) => n.id)

            // for (let index = 0; index < node.children.length; index++) {
            //   let childNode = node.children[index]
            //   let childBounds = childNode.getBoundingClientRect()
            //   let currLabel = `[${childNode.tagName}_${childNode.id}]_${childBounds.top}`

            //   if (isElement(childNode)) {
            //     // let position = getElementTop(childNode)
            //     let position = currHeight
            //     let nextIterationHeight = currPageHeight + childBounds.height

            //     if (!firstPageNode) firstPageNode = childNode

            //     // Cuts off / breakpoint line / end of a page
            //     if (nextIterationHeight > pageHeight) {
            //       console.log(
            //         `%c${currLabel} Reached breakpoint/cutoff line from ` +
            //           `incoming node of height ${childBounds.height} of top ${childBounds.top} on ${nextIterationHeight}`,
            //         `color:#FF5722;`,
            //       )

            //       const prevSibling = childNode.previousElementSibling

            //       if (prevSibling) {
            //         if (
            //           prevSibling.classList.contains('label') ||
            //           [...prevSibling.children].some((n) =>
            //             n.classList.contains('label'),
            //           )
            //         ) {
            //           window.prevSibling = prevSibling
            //           debugger
            //         }
            //       }

            //       firstPageNode.scrollIntoView()

            //       let startPosition = position

            //       const canvas = await html2canvas(node, {
            //         allowTaint: true,
            //         onclone: (doc, el) => {
            //           counter++
            //           let position = 0
            //           for (const childNode of el.children) {
            //             if (isElement(childNode)) {
            //               childNode.style.border = '1px solid red'
            //               const { height } = childNode.getBoundingClientRect()
            //               position = getElementTop(childNode)
            //               const positionWithHeight = position + height
            //               const removeBeforePosition =
            //                 currHeight - currPageHeight
            //               const removeAfterPosition =
            //                 currHeight + currPageHeight

            //               const willOverflow = position > currHeight

            //               console.log({
            //                 textContent: childNode.textContent,
            //                 currPageHeight,
            //                 currHeight,
            //                 position,
            //                 height,
            //                 positionWithHeight,
            //                 removeBeforePosition,
            //                 removeAfterPosition,
            //                 willOverflow,
            //               })

            //               if (
            //                 willOverflow ||
            //                 position < removeBeforePosition ||
            //                 position > removeAfterPosition
            //               ) {
            //                 console.log(
            //                   `%c[Removing] ${childNode.tagName} - ${childNode.id}`,
            //                   `color:#00b406;font-weight:400;`,
            //                   childNode.textContent,
            //                 )
            //                 childNode.style.visibility = 'hidden'
            //                 if (
            //                   positionWithHeight > removeAfterPosition &&
            //                   !pendingIds.includes(childNode.id)
            //                 ) {
            //                   pendingIds.push(childNode.id)
            //                 }
            //               } else {
            //                 if (pendingIds.includes(childNode.id)) {
            //                   pendingIds.splice(
            //                     pendingIds.indexOf(childNode.id),
            //                     1,
            //                   )
            //                 }
            //               }
            //             }
            //           }
            //         },
            //         width,
            //         height,
            //         scrollY: startPosition,
            //         windowWidth: overallWidth,
            //         windowHeight: overallHeight,
            //       })

            //       doc.addPage(format, orientation)
            //       doc.addImage(canvas, 'PNG', 0, 0, canvas.width, canvas.height)

            //       currPageHeight = 0
            //       firstPageNode = childNode
            //     }

            //     currHeight += childBounds.height
            //     currPageHeight += childBounds.height
            //   }
            // }
          } else {
            const canvas = await html2canvas(node, {
              width,
              height,
              windowHeight: height,
            })

            doc.addPage(format, orientation)
            doc.addImage(node, 'PNG', 0, 0, width, height)
          }

          // for (let index = 0; index <= totalPages; index++) {
          //   let scrollPos = height * index
          //   let yOffset = 0
          //   let pageNum = index + 1
          //   let currHeight = height * pageNum
          //   // if the last page on canvas should have space (y-offset)
          //   if (currHeight > overallHeight) {
          //     scrollPos = overallHeight - height
          //     yOffset = height - (overallHeight - height * index)
          //   }
          //   node.scrollTo({ top: scrollPos })
          //   const canvas = await html2canvas(node, {
          //     allowTaint: true,
          //     width: width,
          //     height: height,
          //     y: yOffset,
          //   })
          //   doc.addPage(format, orientation)
          //   doc.addImage(canvas.toDataURL(), 'PNG', 0, 0, width, height)
          // }
          node.scrollTo({ top: originalScrollPos })

          return doc
        } catch (error) {
          if (error instanceof Error) throw error
          throw new Error(String(error))
        }
      }

      const createDocByObject = async (
        data: Record<string, any>,
      ): Promise<jsPDF> => {
        try {
          const { title = '', content = '', data: dataProp = content } = data
          const doc = new jspdf.jsPDF({
            compress: true,
            orientation: 'portrait',
            unit: 'px',
          })
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(12)
          const options = {
            baseline: 'top',
            // @ts-expect-error
            maxWidth: doc.getPageWidth() - 20,
          } as Parameters<jsPDF['text']>[3]
          if (title) {
            doc.text(labels ? `Title: ${title}` : title, 10, 10, options)
          }
          if (dataProp && u.isStr(dataProp)) {
            if (dataProp.startsWith('blob:') || dataProp.startsWith('data:')) {
              const { img, width, height } = await getImageDataUrlProps(
                dataProp,
              )
              doc.addImage(img, 'png', 0, 0, width, height)
            } else {
              doc.text(
                labels ? 'Content: ' + dataProp : dataProp,
                10,
                25,
                options,
              )
            }
          } else if (content) {
            doc.text(content, 10, 25, options)
          }
          return doc
        } catch (error) {
          if (error instanceof Error) throw error
          throw new Error(String(error))
        }
      }

      const doc = u.isStr(data)
        ? await createDocByDataURL(data)
        : 'tagName' in data
        ? await createDocByDOMNode(data)
        : u.isObj(data)
        ? await createDocByObject(data)
        : null

      if (!doc) throw new Error(`data is not a string, DOM node or object`)

      open && doc.output('pdfobjectnewwindow')
      shouldDownload && download(doc.output('datauristring'), filename)
      resolve(doc)
    } catch (error) {
      u.logError(error)
      reject(error instanceof Error ? error : new Error(String(error)))
    }
  })
}

export function getDataUrl(elem: HTMLImageElement) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = elem.width
  canvas.height = elem.height
  ctx?.drawImage(elem, 0, 0)
  return canvas.toDataURL('image/png')
}

export function getDocumentScrollTop(doc?: Document | null) {
  return (doc || document)?.body?.scrollTop
}

export function getElementTop(el: HTMLElement) {
  return (
    el.offsetTop +
      (el.offsetParent && getElementTop(el.offsetParent as HTMLElement)) || 0
  )
}

export function getVcodeElem(dataKey = 'formData.code') {
  return u.array(asHtmlElement(findByDataKey(dataKey)))[0] as HTMLInputElement
}

export const hide = makeElemFn(
  (node) => node?.style && (node.style.visibility = 'hidden'),
)
export const show = makeElemFn((node) => {
  if (!node?.style) return
  node.style.visibility !== 'visible' && (node.style.visibility = 'visible')
  node.style.display === 'none' && (node.style.display = 'block')
})

/**
 * Returns true if the value can be displayed in the UI as normal.
 * A displayable value is any value that is a string or number
 * @param { any } value
 */
export function isDisplayable(value: unknown): value is string | number {
  return value == 0 || typeof value === 'string' || typeof value === 'number'
}

export function isVisible(node: HTMLElement | null) {
  return node
    ? node.style?.visibility === 'visible' ||
        node.style?.visibility !== 'hidden'
    : false
}

/**
 * Opens the file select window. The promise resolves when a file was
 * selected, which becomes the resolved value.
 * @param { HTMLInputElement? } inputNode - Optional existing input node to use
 */
export function openFileSelector(
  inputNode?: HTMLInputElement,
): Promise<FileSelectorResult> {
  // onSelect: (err: null | Error, args?: { e?: any; files?: FileList }) => void,
  return new Promise((resolve) => {
    const input = inputNode || document.createElement('input')
    hide(input)
    input.type = 'file'
    input.onclick = function onFileInputClick(event) {
      document.body.onfocus = () => {
        document.body.onfocus = null
        setTimeout(() => {
          document.body.removeChild(input)
          resolve({
            event,
            files: input.files?.length ? input.files : null,
            status: input.files?.length ? 'selected' : 'canceled',
          } as FileSelectorCanceledResult)
        }, 350)
      }
    }
    input.onerror = function onFileInputError(
      message,
      source,
      lineNumber,
      columnNumber,
      error,
    ) {
      document.body.onfocus = null
      resolve({
        event: null,
        message,
        source,
        lineNumber,
        columnNumber,
        error: error as Error,
        status: 'error',
        files: null,
      })
    }
    document.body.appendChild(input)
    input.click()
  })
}

type DocumentScrollTopOptions = {
  top?: number
  left?: number
  smooth?: boolean
  win?: Window
}

/**
 * Set the current vertical position of the scroll bar for document
 * Note: do not support fixed position of body
 * @param { number } value
 */
export function setDocumentScrollTop(opts: DocumentScrollTopOptions): void
export function setDocumentScrollTop(top?: number, win?: Window | null): void
export function setDocumentScrollTop(str: 'bottom'): void
export function setDocumentScrollTop(str: 'center'): void
export function setDocumentScrollTop(
  opts: 'bottom' | 'center' | number | DocumentScrollTopOptions = 0,
  win?: Window | null,
) {
  let top: number | undefined
  let left: number | undefined
  let behavior = 'smooth' as ScrollBehavior

  if (u.isObj(opts)) {
    top = opts.top || 0
    left = opts.left || window.scrollX
    opts.smooth === false && (behavior = 'auto')
  } else if (u.isNum(opts)) {
    top = opts
  } else if (opts === 'bottom') {
    top = (win || window).screen.height
  } else if (opts === 'center') {
    top = (win || window).screen.height / 2
  }

  u.isUnd(top) && (top = 0)
  u.isUnd(left) && (left = window.scrollX)
  ;(win || window).scrollTo({ top, left, behavior })
}

/**
 * Scroll to location with animation
 * @param  {Number} to       to assign the scrollTop value
 * @param  {Number} duration assign the animate duration
 * @return {Null}            return null
 */
export function scrollTo(
  to = 0,
  duration = 16,
  { doc, win }: { doc?: Document | null; win?: Window | null },
) {
  if (duration < 0) {
    return
  }
  const diff = to - getDocumentScrollTop(doc)
  if (diff === 0) {
    return
  }
  const perTick = (diff / duration) * 10
  requestAnimationFrame(() => {
    if (Math.abs(perTick) > Math.abs(diff)) {
      setDocumentScrollTop(getDocumentScrollTop(doc) + diff, win)
      return
    }
    setDocumentScrollTop(getDocumentScrollTop(doc) + perTick, win)
    if (
      (diff > 0 && getDocumentScrollTop(doc) >= to) ||
      (diff < 0 && getDocumentScrollTop(doc) <= to)
    ) {
      return
    }
    scrollTo(to, duration - 16, { doc, win })
  })
}

export function scrollToElem(
  node: any,
  {
    win,
    doc,
    duration,
  }: { win?: Window | null; doc?: Document | null; duration?: number } = {},
) {
  node && scrollTo(node.getBoundingClientRect().top, duration, { doc, win })
}

export function toast(message: string | number, options?: Toast['options']) {
  if (message) {
    const container = document.getElementsByClassName('toast-container')[0]
    // This is a better version of destroyAllToasts from the lib
    if (container?.childNodes?.length) {
      for (const childNode of container.children) childNode.remove()
    }
    return createToast?.(String(message), {
      cancel: 'Close',
      timeout: 8000,
      ...options,
    })
  }
}

export function getBlobFromCanvas(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number = 8,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality))
}
