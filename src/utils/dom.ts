import isPlainObject from 'lodash/isPlainObject'
import { createToast, Toast } from 'vercel-toast'
import { NOODLDOMElement } from 'noodl-ui-dom'
import { FileInputEvent } from '../app/types'
import { forEachEntries } from './common'

export function copyToClipboard(value: string) {
  const textarea = document.createElement('textarea')
  textarea.value =
    typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  document.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange(0, 9999999)
  document.execCommand('copy')
  textarea.remove()
}

export function getDocumentScrollTop() {
  // IE8 used `document.documentElement`
  return (
    (document.documentElement && document.documentElement.scrollTop) ||
    document.body.scrollTop
  )
}

/**
 * Returns true if the value can be displayed in the UI as normal.
 * A displayable value is any value that is a string or number
 * @param { any } value
 */
export function isDisplayable(value: unknown): value is string | number {
  return value == 0 || typeof value === 'string' || typeof value === 'number'
}

interface OnSelectFileBaseResult {
  event: FileInputEvent | FocusEvent
  files: FileList | null
}

interface OnSelectFileSelectedResult extends OnSelectFileBaseResult {
  status: 'selected'
}

interface OnSelectFileCanceledResult extends OnSelectFileBaseResult {
  event: FocusEvent
  files: null
  status: 'canceled'
}

interface OnSelectFileErrorResult extends OnSelectFileBaseResult {
  event: FileInputEvent
  lineNumber: number | undefined
  columnNumber: number | undefined
  message: string | Error
  source: number | undefined
}

/**
 * Opens the file select window. The promise resolves when a file was
 * selected, which becomes the resolved value.
 * @param { HTMLInputElement? } inputNode - Optional existing input node to use
 */
export function onSelectFile(
  inputNode?: HTMLInputElement,
): Promise<OnSelectFileSelectedResult>
export function onSelectFile(
  inputNode?: HTMLInputElement,
): Promise<OnSelectFileCanceledResult>
export function onSelectFile(
  inputNode?: HTMLInputElement,
): Promise<OnSelectFileErrorResult>
export function onSelectFile(
  inputNode?: HTMLInputElement,
): Promise<
  | OnSelectFileSelectedResult
  | OnSelectFileCanceledResult
  | OnSelectFileErrorResult
> {
  // onSelect: (err: null | Error, args?: { e?: any; files?: FileList }) => void,
  return new Promise((resolve, reject) => {
    const input = inputNode || document.createElement('input')
    input.style['visibility'] = 'hidden'
    input['type'] = 'file'

    input['onclick'] = function (event) {
      document.body['onfocus'] = () => {
        document.body['onfocus'] = null
        setTimeout(() => {
          document.body.removeChild(input)
          resolve({
            event,
            files: input.files?.length ? input.files : null,
            status: input.files?.length ? 'selected' : 'canceled',
          } as OnSelectFileCanceledResult)
        }, 350)
      }
    }

    input['onerror'] = function onFileInputError(
      message,
      source,
      lineNumber,
      columnNumber,
      error,
    ) {
      document.body.onfocus = null
      reject({
        message,
        source,
        lineNumber,
        columnNumber,
        error,
      })
    }

    document.body.appendChild(input)

    input.click()
  })
}

export function isVisible(node: any) {
  return (
    node?.style?.visibility === 'visible' ||
    node?.style?.visibility !== 'hidden'
  )
}

/**
 * Set the current vertical position of the scroll bar for document
 * Note: do not support fixed position of body
 * @param { number } value
 */
function setDocumentScrollTop(value: number) {
  window.scrollTo(0, value)
  return value
}

/**
 * Scroll to location with animation
 * @param  {Number} to       to assign the scrollTop value
 * @param  {Number} duration assign the animate duration
 * @return {Null}            return null
 */
export function scrollTo(to = 0, duration = 16) {
  if (duration < 0) {
    return
  }
  const diff = to - getDocumentScrollTop()
  if (diff === 0) {
    return
  }
  const perTick = (diff / duration) * 10
  requestAnimationFrame(() => {
    if (Math.abs(perTick) > Math.abs(diff)) {
      setDocumentScrollTop(getDocumentScrollTop() + diff)
      return
    }
    setDocumentScrollTop(getDocumentScrollTop() + perTick)
    if (
      (diff > 0 && getDocumentScrollTop() >= to) ||
      (diff < 0 && getDocumentScrollTop() <= to)
    ) {
      return
    }
    scrollTo(to, duration - 16)
  })
}

export function scrollToElem(
  node: any,
  { duration }: { duration?: number } = {},
) {
  if (node) scrollTo(node.getBoundingClientRect().top, duration)
}

export function toast(message: string | number, options?: Toast['options']) {
  return createToast(String(message), {
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
  node: NOODLDOMElement,
  cond?: (arg: { isHidden: boolean }) => 'visible' | 'hidden',
) {
  if (node?.style) {
    const isHidden = node.style.visibility === 'hidden'
    if (typeof cond === 'function') {
      node.style['visibility'] = cond({ isHidden })
    } else {
      node.style['visibility'] = isHidden ? 'visible' : 'hidden'
    }
  }
}

/**
 * Sets the style for an HTML DOM element. If key is an empty string it
 * will erase all styles
 * @param { HTMLElement } node
 * @param { string | Styles | undefined } key
 * @param { any | undefined } value
 */
export function setStyle(node: HTMLElement, key?: string | any, value?: any) {
  if (node) {
    if (typeof key === 'string') {
      // Normalize unsetting
      if (key === '') {
        key = 'cssText'
        value = ''
      }
      node.style[key as any] = value
    } else if (isPlainObject(key)) {
      forEachEntries(key, (k: any, v) => {
        node.style[k] = v
      })
    }
  }
}
