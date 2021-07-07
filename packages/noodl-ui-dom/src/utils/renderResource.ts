import * as u from '@jsmanifest/utils'
import isCssResourceRecord from './isCssResourceRecord'
import isJsResourceRecord from './isJsResourceRecord'
import * as t from '../types'

export interface OnLoadCallback<T extends t.GlobalResourceType> {
  (options: {
    event?: Event
    node: t.GetGlobalResourceElementAlias<T>
    record: t.GetGlobalResourceRecordAlias<T>
  }): void
}

/**
 * Takes a GlobalResourceRecord and renders a DOM node corresponding to the type of resource it is
 *
 * This currently supports only css or javascript
 *
 * @param { GlobalCssResourceRecord | GlobalJsResourceRecord }
 * @returns HTMLLinkElement | HTMLScriptElement | undefined
 */

function renderResource<T extends t.GlobalResourceType>(
  record: t.GetGlobalResourceRecordAlias<T>,
  onLoad?: OnLoadCallback<T>,
) {
  let node: unknown

  if (isCssResourceRecord(record)) {
    renderToDOM({
      record,
      onLoad,
      elementProps: { rel: 'stylesheet', type: 'text/css' },
    })
  } else if (isJsResourceRecord(record)) {
    renderToDOM({
      record,
      onLoad,
      elementProps: { type: 'application/json' },
    })
  }

  return node as t.GetGlobalResourceRecordAlias<T>
}

function onElementLoad<T extends t.GlobalResourceType>({
  node,
  record,
  callback,
}: {
  callback?: OnLoadCallback<T>
  node: t.GetGlobalResourceElementAlias<T>
  record: t.GetGlobalResourceRecordAlias<T>
}) {
  function onload(evt: Event) {
    node?.removeEventListener?.('load', onload)
    return callback?.({ event: evt, node, record })
  }
  return onload
}

function renderToDOM<T extends t.GlobalResourceType>({
  record,
  elementProps,
  onLoad,
}: {
  record: t.GetGlobalResourceRecordAlias<T>
  elementProps?: Record<string, any>
  onLoad?: OnLoadCallback<T>
}) {
  const isCss = record.resourceType === 'css'
  const idKey = isCss ? 'href' : 'src'
  const location = isCss ? 'head' : 'body'
  const elementTag = isCss ? 'link' : 'script'
  const node = (document.getElementById(record.id) ||
    document.createElement(elementTag)) as t.GetGlobalResourceElementAlias<T>

  node.id = record.id
  node[idKey] = record.id

  if (!document[location].contains(node)) {
    // "onload" doesn't get called for <link /> elements, but we can also
    // just immediately continue since we don't need to wait for CSS for behavior
    if (elementTag === 'link') {
      onLoad?.({ node, record })
    } else {
      node.addEventListener(
        'load',
        onElementLoad({ callback: onLoad, node, record }),
      )
    }
    document[location].appendChild(node)
  } else {
    onLoad?.({ node, record })
  }

  if (u.isObj(elementProps)) {
    for (const [key, value] of u.entries(elementProps)) {
      node.setAttribute(key, value)
    }
  }
}

export default renderResource
