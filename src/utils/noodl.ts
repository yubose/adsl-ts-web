import _ from 'lodash'
import { ProxiedComponent } from 'noodl-ui'
import { forEachEntries } from 'utils/common'

/**
 * Takes a parsed NOODL component and transforms its attributes to create a
 * representable DOM node
 * @param { ProxiedComponent } component - NOODLComponent that is parsed into a ProxiedComponent
 */
export function toDOMNode<K extends keyof HTMLElementTagNameMap>(
  component: ProxiedComponent,
) {
  const node = document.createElement(component.type as K)

  if (node) {
    forEachEntries(component, (key, value) => {
      // Traverse the children hierarchy and resolve them as descendants
      if (key === 'children') {
        if (_.isString(value) || _.isNumber(value)) {
          node.innerHTML += value
        } else {
          _.forEach(value, (child) => {
            let childNode
            if (_.isPlainObject(child)) {
              childNode = toDOMNode(child)
              if (childNode) {
                node?.appendChild(childNode)
              }
            } else if (_.isString(child) || _.isFinite(child)) {
              node.innerHTML += child
            }
          })
        }
      } else if (key === ('style' as any)) {
        forEachEntries(value, (k: string, v) => {
          node.style[k as any] = v
        })
      } else if (key === 'onClick') {
        node.onclick = value
      } else {
        node?.setAttribute(key as string, value)
      }
    })
  }

  return node
}
