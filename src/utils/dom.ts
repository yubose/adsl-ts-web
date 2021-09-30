import * as u from '@jsmanifest/utils'
import type jsPDF from 'jspdf'
import { asHtmlElement, findByDataKey, makeElemFn } from 'noodl-ui-dom'
import { createToast, Toast } from 'vercel-toast'
import { FileSelectorResult, FileSelectorCanceledResult } from '../app/types'

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
          window.doc = doc
          let { width, height, fileType } = doc.getImageProperties(node)
          ext =
            (fileType &&
              (fileType.startsWith('.') ? fileType : `.${fileType}`)) ||
            ext
          doc.setFont('Roboto')
          doc.save(filename)
          const blob = doc.output('blob', { filename }) as Blob
          // download(blob, filename)
          window.open(doc.output('bloburi'), '_blank')
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
