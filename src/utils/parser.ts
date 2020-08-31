import _ from 'lodash'
import {
  eventTypes,
  isReference,
  NOODLComponentProps,
  SelectOption,
} from 'noodl-ui'
import { forEachEntries } from 'utils/common'
import { Options } from 'webpack'

// TODO do a more generic solution
const keysHandling = [
  'children',
  'data-value',
  'onClick',
  'options',
  'style',
] as const

/**
 * Handles innerHTML / select values, and other values for the node to display their content
 * @param { HTMLElement } node
 * @param { string } key
 * @param { any } value
 * @param { object } props
 */
export const parseChildren = createParser(
  (node: HTMLElement, { key, value, props }) => {
    if (key === 'children') {
      if (_.isString(value) || _.isNumber(value)) {
        node.innerHTML += `${value}`
      } else if (_.isArray(value)) {
        _.forEach(value, toDOMNode)
      }
    }
    // Attaching children for the select elem
    else if (key === 'options') {
      if (props.type === 'select') {
        if (_.isArray(value)) {
          _.forEach(value, (option: SelectOption) => {
            if (option) {
              const optionElem = document.createElement('option')
              optionElem.id = option.key
              optionElem.value = option?.value
              optionElem.innerText = option.label
              node.appendChild(optionElem)
            } else {
              //log
            }
          })
        } else {
          // log
        }
      }
    }
  },
)

export const parseEventHandlers = createParser(
  (node: HTMLElement, { key, value, props }) => {
    if (node) {
      if (eventTypes.includes(key as typeof eventTypes[number])) {
        if (_.isFunction(value)) {
          const lowercasedEventType = (key as string).toLowerCase()
          node.addEventListener(
            lowercasedEventType.startsWith('on')
              ? lowercasedEventType.replace('on', '')
              : lowercasedEventType,
            value,
          )
        } else {
          // log
        }
      }
      if (key === 'data-value') {
        // const onChange = (e: Event) => {
        //   const target: typeof e.target & {
        //     value?: any
        //   } | null = e.target
        // }
        // node.addEventListener('onchange', onChange)
      }
    }
  },
)

export const parseStyles = createParser((node, { key, value }) => {
  if (key === 'style' && _.isObjectLike(value)) {
    forEachEntries(value, (k, v) => {
      node.style[k as any] = v
    })
  } else {
    // log
  }
})

export const parseDataValues = createParser((node, { key, value, props }) => {
  if (key === 'data-value' && value != undefined) {
    if (['input', 'select', 'textarea'].includes(props.type)) {
      const elem = node as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement
      elem.value = value
    }
  }
})

export function composeParsers(...fns: any[]) {
  const attachFns = (
    node: HTMLElement,
    args: { key: string | number; value: any; props: NOODLComponentProps },
  ) => {
    _.forEach(fns, (fn) => fn?.(node, args))
  }
  return attachFns
}

export function _composeParsers(...fns: any[])

export function createParser(fn: ReturnType<typeof composeParsers>) {
  return (...args: Parameters<ReturnType<typeof composeParsers>>) => {
    if (args[1]) {
      return fn(...args)
    }
  }
}

export const applyAttachers = composeParsers(
  parseChildren,
  parseEventHandlers,
  parseStyles,
  parseDataValues,
)

/**
 * Takes a parsed NOODL component and transforms its attributes to create a
 * representable DOM node
 * @param { NOODLComponentProps } props - Props resulting from a resolved ProxiedComponent
 */
export function toDOMNode(props: NOODLComponentProps) {
  const node = document.createElement(props.type)

  if (node) {
    forEachEntries(props, (key, value) => {
      if (keysHandling.includes(key as any)) {
        applyAttachers(node, { key, value, props })

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
        }
      } else {
        node.setAttribute(key as string, value)
      }
      // Traverse the children hierarchy and resolve them as descendants
      // if (key === 'children') {

      // } else if (key && key !== 'style') {
      //   node.setAttribute(key as string, value)
      // }
    })
  }

  return node
}

/**
 * Apply the original raw data key value if it is showing. This is meant to be
 * used in conjunction with isShowingDataKey and when the env is 'stable'
 * Else make it invisible in the UI
 * @param { object } props
 */
export function getFallbackDataValue(props: any) {
  if (!props.noodl) {
    return ''
  }
  const { noodl } = props
  let value
  if (typeof props?.text === 'string') {
    value = noodl.text
  } else if (typeof noodl?.placeholder === 'string') {
    value = noodl.placeholder
  }

  return value || !isReference(value as string) ? value : '' || ''
}

/**
 * Returns true if the component is presumed to be displaying raw referenced data keys
 * ex: .Global.vertex.currentUser
 * @param { object } props
 */
export function isShowingDataKey(props: any) {
  if (props['data-key']) {
    return (
      props['data-key'] === props['data-value'] ||
      props['data-key'] === props.children ||
      isReference(props['data-value'] as string) ||
      isReference(props.children as string)
    )
  }
  return false
}

export function parseNOODLComponent(props: NOODLComponentProps) {}
