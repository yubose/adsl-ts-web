import * as u from '@jsmanifest/utils'
import type jsPDF from 'jspdf'
import { throwError } from '@jsmanifest/utils'
import { asHtmlElement, findByDataKey, makeElemFn } from 'noodl-ui-dom'
import { Viewport as NuiViewport } from 'noodl-ui'
import { createToast, Toast } from 'vercel-toast'
import { FileSelectorResult, FileSelectorCanceledResult } from '../app/types'
import { isDataUrl } from './common'

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

export function screenshotElement(
  node: HTMLElement,
  { ext, filename = '' }: { ext?: string; filename?: string } = {},
): Promise<[pdf: jsPDF, canvas: HTMLCanvasElement]> {
  return new Promise((resolve, reject) => {
    filename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
    // const dataUrl = canvas.toDataURL('image/png')
    let doc = new jspdf.jsPDF('p', 'px')
    doc = doc.viewerPreferences({
      CenterWindow: true,
      DisplayDocTitle: true,
    })

    doc = doc.setDocumentProperties({
      author: 'Christopher',
      creator: 'Christopher',
      keywords: 'form',
      subject: 'To whom this may concern',
      title: 'Absentee Form',
    })

    doc
      .html(node, {
        callback: (doc) => {
          // @ts-expect-error
          let { width, height, fileType } = doc.getImageProperties(node)
          ext =
            (fileType &&
              (fileType.startsWith('.') ? fileType : `.${fileType}`)) ||
            ext
          doc.setFont('Roboto')
          doc.save(filename)
          // @ts-expect-error
          const blob = doc.output('blob', { filename }) as Blob
          // download(blob, filename)
          window.open(doc.output('bloburi'), '_blank')
          // @ts-expect-error
          resolve([doc, doc.canvas])
        },
      })
      .then((worker) => {})
      .catch(reject)
  })
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
  }: {
    data:
      | string
      | { title?: string; content?: string; data?: string }
      | HTMLElement
    download?: boolean
    labels?: boolean
    open?: boolean
    filename?: string
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
          const originalScrollPos = node.scrollTop
          const scrollHeight = node.scrollHeight
          const width = NuiViewport.toNum(node.style.width)
          const height = NuiViewport.toNum(node.style.height)
          const orientation = width > height ? 'landscape' : 'portrait'
          const totalPages = Math.floor(scrollHeight / height)
          const format = [width, height]

          const doc = new jspdf.jsPDF({
            compress: true,
            orientation,
            unit: 'px',
            format,
          })
          // Deletes the empty page
          doc.deletePage(1)

          for (let index = 0; index <= totalPages; index++) {
            var scrollPos = height * index
            var yOffset = 0
            // if the last page on canvas should have space (y-offset)
            if (height * (index+1) > node.scrollHeight) {
              scrollPos = (node.scrollHeight - height)
              yOffset = height-(node.scrollHeight - height * index)
            }
            node.scrollTo({ top: scrollPos })
            const canvas = await html2canvas(node, {
              allowTaint: true,
              width: width,
              height: height,
              y: yOffset
            })
            doc.addPage(format, orientation)
            doc.addImage(canvas.toDataURL(), 'PNG', 0, 0, width, height)
          }
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
  node: HTMLCanvasElement,
  mimeType: string,
  quality: number = 8,
): Promise<Blob | null> {
  return new Promise((resolve) => node.toBlob(resolve, mimeType, quality))
}
