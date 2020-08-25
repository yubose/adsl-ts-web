import _ from 'lodash'
import { eventTypes, NOODLComponentProps } from 'noodl-ui'
import { callAll, forEachEntries } from 'utils/common'

/**
 * Takes a parsed NOODL component and transforms its attributes to create a
 * representable DOM node
 * @param { NOODLComponentProps } props - Props resulting from a resolved ProxiedComponent
 */
export function toDOMNode(props: NOODLComponentProps) {
  const node = document.createElement(props.type)

  if (node) {
    forEachEntries(props, (key, value) => {
      // Traverse the children hierarchy and resolve them as descendants
      if (key === 'children') {
        if (_.isString(value) || _.isNumber(value)) {
          node.innerHTML += `${value}`
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

const attachToDOMNodes = _.flowRight(attachChildren, attachEventHandlers)

const composeAttachers = <N extends HTMLElement>(...fns: Function[]) => (
  node: N,
) => (props: NOODLComponentProps) => toDOMNode()

const accumulate = (acc, props) => attachToDOMNodes(props)

export function attachChildren(node: HTMLElement) {
  return (props: NOODLComponentProps) => {
    if (props['data-value']) {
      if (
        node instanceof HTMLInputElement ||
        node instanceof HTMLSelectElement ||
        node instanceof HTMLTextAreaElement
      ) {
        node.value = props['data-value']
      }
    } else if (props.children) {
      if (_.isString(props.children) || _.isNumber(props.children)) {
        node.innerHTML += `${props.children}`
      }
    }

    if (props.placeholder) {
      //
    }
    return props
  }
}

export function attachEventHandlers(node: HTMLElement) {
  return (props: NOODLComponentProps) => {
    if (node) {
      const numEventTypes = eventTypes.length
      for (let index = 0; index < numEventTypes; index++) {
        // Convert camelCase to lowercase
        const eventType = eventTypes[index]

        if (props[eventType]) {
          node.addEventListener(eventType, props[eventType])
        }
      }
    }
  }
}
