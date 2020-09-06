import _ from 'lodash'
import { NOODLComponentProps } from 'noodl-ui'
import parse from './parse'

/**
 * Takes a NOODLComponentProps object and creates a DOM node
 * described by the NOODLComponentProps object
 * @param { NOODLComponentProps } props - Props resulting from a resolved ProxiedComponent
 */
export function toDOMNode(props: NOODLComponentProps) {
  const node = parse(props)

  if (_.isArray(props.children)) {
    _.forEach(props.children, (child) => {
      const childNode = toDOMNode(child as NOODLComponentProps)

      if (childNode) {
        node?.appendChild(childNode)
      }
    })
  }

  return node
}

export default toDOMNode
