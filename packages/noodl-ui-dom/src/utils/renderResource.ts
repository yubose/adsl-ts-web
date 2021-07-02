import * as u from '@jsmanifest/utils'
import isCssResourceRecord from './isCssResourceRecord'
import isJsResourceRecord from './isJsResourceRecord'
import * as t from '../types'

export interface OnLoadCallback<T extends t.GlobalResourceType> {
  (node: t.GetGlobalResourceElementAlias<T>): void
}

/**
 * Takes a GlobalResourceRecord and renders a DOM node corresponding to the type of resource it is
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

  let node =
    document.getElementById(record.id) || document.createElement(elementTag)

  node.id = record.id

  node[idKey] = record.id

  if (!document[location].contains(node)) {
    document[location].appendChild(node)
    node.onload = () => onLoad?.(node as t.GetGlobalResourceElementAlias<T>)
  } else {
    onLoad?.(node as t.GetGlobalResourceElementAlias<T>)
  }

  if (u.isObj(elementProps)) {
    for (const [key, value] of u.entries(elementProps)) {
      node.setAttribute(key, value)
    }
  }

  // document[location].appendChild(node)
}

export default renderResource
