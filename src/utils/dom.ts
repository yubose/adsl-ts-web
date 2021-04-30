import { asHtmlElement, findByDataKey } from 'noodl-ui-dom'
import { createToast, Toast } from 'vercel-toast'
import { makeElemFn } from 'noodl-ui-dom'
import { array } from './common'
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

export function getDocumentScrollTop(doc?: Document | null) {
  return (doc || document)?.body?.scrollTop
}

export function getVcodeElem(dataKey = 'formData.code') {
  return array(asHtmlElement(findByDataKey(dataKey)))[0] as HTMLInputElement
}

export const hide = makeElemFn((node) => (node.style.visibility = 'hidden'))
export const show = makeElemFn((node) => {
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

/**
 * Set the current vertical position of the scroll bar for document
 * Note: do not support fixed position of body
 * @param { number } value
 */
function setDocumentScrollTop(value: number, win?: Window | null) {
  ;(win || window).scrollTo(0, value)
  return value
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
  return createToast?.(String(message), {
    cancel: 'Close',
    timeout: 8000,
    ...options,
  })
}

/**
 * Toggles the visibility state of a DOM node. If a condition func is passed,
 * it will be called and passed an object with a "isHidden" prop that reveals its
 * current visibility state. The callback must return 'visible' or 'hidden' that
 * will be used as the new visibility state. The return
 * @param { HTMLElement } node - DOM node
 * @param { function? } cond - Function returning 'visible' or 'hidden'
 */
export function toggleVisibility(
  node: HTMLElement,
  cond?: (arg: { isHidden: boolean }) => 'visible' | 'hidden',
) {
  if (node?.style) {
    const isHidden = node.style.visibility === 'hidden'
    if (typeof cond === 'function') {
      node.style.visibility = cond({ isHidden })
    } else {
      node.style.visibility = isHidden ? 'visible' : 'hidden'
    }
  }
}
