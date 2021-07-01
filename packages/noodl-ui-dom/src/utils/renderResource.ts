import isCssResourceRecord from './isCssResourceRecord'
import isJsResourceRecord from './isJsResourceRecord'
import * as t from '../types'

export interface OnLoadCallback<T extends t.GlobalResourceType[][number]> {
  (node: t.GetGlobalResourceElementAlias<T>): void
}

/**
 * Takes a url and renders a DOM node corresponding to the type of resource it is
 *
 * For example, if id is "https://www.somewebsite.com/somestyles.min.css", it will create a link element if there isn't already one existent in the document head.
 *
 * This currently supports only css or javascript
 *
 * @param id string
 * @returns HTMLLinkElement | HTMLScriptElement | undefined
 */

function renderResource<T extends t.GlobalResourceType[][number]>(
  record: t.GetGlobalResourceRecordAlias<T>,
  onLoad?: OnLoadCallback<T>,
) {
  let node: unknown

  if (isCssResourceRecord(record)) {
    let node = document.head.querySelector(
      `link[href="${record.href}"]`,
    ) as HTMLLinkElement

    if (!node) {
      node = document.createElement('link') as HTMLLinkElement
      node.id = record.href
      node.rel = 'stylesheet'
      node.type = 'text/css'
      node.href = record.href
    }
    if (!document.head.contains(node)) {
      document.head.appendChild(node)
      onLoad?.(node)
    }
  } else if (isJsResourceRecord(record)) {
    let node = document.getElementById(record.src) as HTMLScriptElement

    if (!node) {
      node = document.createElement('script')
      node.id = record.src
      node.onload = (evt) => {
        console.info(`%cLoaded SCRIPT element to body`, `color:#00b406;`, {
          event: evt,
          src: record.src,
        })
        onLoad?.(node)
      }
    }
    if (node) {
      node.src = record.src
      if (!document.body.contains(node)) {
        document.body.appendChild(node)
      }
    }
  }

  return node as t.GetGlobalResourceRecordAlias<T>
}

export default renderResource
