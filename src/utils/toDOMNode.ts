import _ from 'lodash'
import { NOODLComponentProps } from 'noodl-ui'
import parse from './parse'

/**
 * Takes a NOODLComponentProps object and parses its attributes, creating a DOM node
 * and attaching attributes described from props
 * @param { NOODLComponentProps } props - Props resulting from a resolved ProxiedComponent
 */
export function toDOMNode(props: NOODLComponentProps) {
  const node = parse(props)

  if (node && _.isArray(node.children)) {
    _.forEach(node.children, (child: NOODLComponentProps) => {
      const childNode = toDOMNode(child)

      if (childNode) {
        node.appendChild(childNode)
      }
    })
  }

  return node
}

export default toDOMNode
