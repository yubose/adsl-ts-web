import _ from 'lodash'
import { Styles } from 'app/types'
import { forEachEntries } from './common'
import NOODLDOMElement from 'components/NOODLElement'

export function copyToClipboard(value: string) {
  const textarea = document.createElement('textarea')
  textarea.value = _.isString(value) ? value : JSON.stringify(value, null, 2)
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

/** Opens the file select window. The selected file is the resolved value */
export function openFileSelect(): Promise<File> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = (e: any) => {
      let file = e.target?.files?.[0]
      document.body.removeChild(input)
      resolve(file)
    }
    input.style.display = 'none'
    document.body.appendChild(input)
    input.click()
  })
}

export function getOffset(el: HTMLElement) {
  const html = el.ownerDocument.documentElement
  let box = { top: 0, left: 0 }
  // If we don't have gBCR, just use 0,0 rather than error
  // BlackBerry 5, iOS 3 (original iPhone)
  if (typeof el.getBoundingClientRect !== 'undefined') {
    box = el.getBoundingClientRect()
  }
  return {
    top: box.top + window.pageYOffset - html.clientTop,
    left: box.left + window.pageXOffset - html.clientLeft,
  }
}

export function getPosition(el: HTMLElement) {
  if (!el) {
    return {
      left: 0,
      top: 0,
    }
  }
  return {
    left: el.offsetLeft,
    top: el.offsetTop,
  }
}

export interface SetStyle<Elem extends HTMLElement> {
  (node: Elem, key: string | { [key: string]: any }, value?: any): void
}

/**
 * Sets the style for an HTML DOM element. If key is an empty string it
 * will erase all styles
 * @param { HTMLElement } node
 * @param { string | Styles | undefined } key
 * @param { any | undefined } value
 */
export function setStyle(
  node: HTMLElement,
  key?: string | Styles,
  value?: any,
) {
  if (node) {
    if (_.isString(key)) {
      // Normalize unsetting
      if (key === '') {
        key = 'cssText'
        value = ''
      }
      node.style[key as any] = value
    } else if (_.isPlainObject(key)) {
      forEachEntries(key, (k: any, v) => {
        node.style[k] = v
      })
    }
  }
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

/* -------------------------------------------------------
  ---- NOODL-UI-DOM UTILITIES
-------------------------------------------------------- */

const matchNoodlType = (type: any) => ({ noodlType }: any) => noodlType === type

export const isButton = matchNoodlType('button')
export const isDivider = matchNoodlType('divider')
export const isHeader = matchNoodlType('header')
export const isImage = matchNoodlType('image')
export const isLabel = matchNoodlType('label')
export const isList = matchNoodlType('list')
export const isListItem = matchNoodlType('listItem')
export const isPopUp = matchNoodlType('popUp')
export const isSelect = matchNoodlType('select')
export const isTextField = matchNoodlType('textField')
export const isView = matchNoodlType('view')

/* -------------------------------------------------------
  ---- DOM MANIPULATION
-------------------------------------------------------- */

export const setAttr = (attr: string) => (v: keyof NOODLDOMElement) => (
  n: NOODLDOMElement,
) => (n[attr] = v)
export const setDataAttr = (attr: string) => (v: keyof NOODLDOMElement) => (
  n: NOODLDOMElement,
) => (n['dataset'][attr] = v)

export const setDataListId = setDataAttr('data-listid')
export const setDataName = setDataAttr('data-name')
export const setDataKey = setDataAttr('data-key')
export const setDataUx = setDataAttr('data-ux')
export const setDataValue = setDataAttr('data-value')
export const setId = setAttr('id')
export const setPlaceholder = setAttr('placeholder')
export const setSrc = setAttr('src')
export const setVideoFormat = setAttr('type')
