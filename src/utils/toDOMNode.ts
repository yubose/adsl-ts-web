import { NOODLComponentProps } from 'noodl-ui'
import parse from './parse'

/**
 * Takes a NOODLComponentProps object and transforms its attributes to create a
 * representable DOM node
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
