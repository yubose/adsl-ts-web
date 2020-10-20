import _ from 'lodash'
import { NOODLDOMElement } from 'noodl-ui-dom'
import { Styles } from 'app/types'
import { forEachEntries } from './common'

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

/**
 * Opens the file select window. The promise resolves when a file was
 * selected, which becomes the resolved value
 */
export function onSelectFile(
  onSelect: (err: null | Error, args?: { e?: any; files?: FileList }) => void,
) {
  const input = document.createElement('input')
  input.style['visibility'] = 'hidden'
  input['type'] = 'file'
  input['onerror'] = (msg, source, lineNum, columnNum, err) =>
    onSelect(err as Error)
  input['onabort'] = (e) => console.log(`onabort`, e)
  input['oncancel'] = (e) => console.log(`oncancel`, e)
  input['onclose'] = (e) => console.log(`onclose`, e)
  input['onblur'] = (e) => console.log(`onblur`, e)
  input['onended'] = (e) => console.log(`onended`, e)
  input['onsuspend'] = (e) => console.log('onsuspend', e)
  input['onchange'] = (e: any) => {
    e.preventDefault?.()
    e.stopPropagation?.()
    try {
      document.body.removeChild(input)
    } catch (error) {
      window.alert(error.message)
      console.error(error)
    }
    onSelect(null, { e, files: e.target?.files })
  }
  document.body.appendChild(input)
  input.click()
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
    if (_.isFunction(cond)) {
      node.style['visibility'] = cond({ isHidden })
    } else {
      node.style['visibility'] = isHidden ? 'visible' : 'hidden'
    }
  }
}
