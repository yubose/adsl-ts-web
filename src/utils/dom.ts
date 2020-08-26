import _ from 'lodash'
import { Styles } from 'app/types'
import { forEachEntries } from 'utils/common'

export function getDocumentScrollTop() {
  // IE8 used `document.documentElement`
  return (
    (document.documentElement && document.documentElement.scrollTop) ||
    document.body.scrollTop
  )
}

export interface SetStyle<Elem extends HTMLElement> {
  (node: Elem, key: string | { [key: string]: any }, value?: any): void
}

export function setStyle(
  node: HTMLElement,
  key?: string | Styles,
  value?: any,
) {
  if (node) {
    if (_.isString(key)) {
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
