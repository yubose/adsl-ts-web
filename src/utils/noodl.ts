import _ from 'lodash'
import { eventTypes, isReference, NOODLComponentProps } from 'noodl-ui'
import { forEachEntries } from 'utils/common'

export const attachStyles = createAttacher((node, props) => {
  if (node && props?.style) {
    forEachEntries(props.style, (k, v) => {
      node.style[k as any] = v
    })
  }
})

export function composeAttachers(...fns: any[]) {
  return <E extends HTMLElement>(node: E, props: NOODLComponentProps) => {
    _.forEach(fns, (fn) => fn?.(node, props))
  }
}

export const attachToDOMNode = composeAttachers(
  attachChildren,
  attachEventHandlers,
  attachStyles,
)

export function createAttacher(fn: ReturnType<typeof composeAttachers>) {
  return (...args: Parameters<ReturnType<typeof composeAttachers>>) => {
    return fn(...args)
  }
}

/**
 * Takes a parsed NOODL component and transforms its attributes to create a
 * representable DOM node
 * @param { NOODLComponentProps } props - Props resulting from a resolved ProxiedComponent
 */
export function toDOMNode(props: NOODLComponentProps) {
  const node = document.createElement(props.type)

  if (node) {
    attachToDOMNode(node, props)
    forEachEntries(props, (key, value) => {
      // Traverse the children hierarchy and resolve them as descendants
      if (key === 'children') {
        if (_.isObjectLike(value)) {
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
      } else if (key && key !== 'style') {
        node.setAttribute(key, value)
      }
    })
  }

  return node
}

export function attachChildren(node: HTMLElement, props: NOODLComponentProps) {
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
    if (!isReference(props.placeholder)) {
      node.setAttribute('placeholder', props.placeholder)
    }
  }
}

export function attachEventHandlers(
  node: HTMLElement,
  props: NOODLComponentProps,
) {
  if (node) {
    const numEventTypes = eventTypes.length
    for (let index = 0; index < numEventTypes; index++) {
      // Convert camelCase to lowercase
      const eventType = eventTypes[index]

      if (props[eventType]) {
        node[eventType.toLowerCase()] = props[eventType]
      }
    }
  }
}
