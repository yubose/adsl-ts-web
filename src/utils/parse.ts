import _ from 'lodash'
import {
  eventTypes,
  isReference,
  NOODLComponentProps,
  SelectOption,
} from 'noodl-ui'
import { DataValueElement, DOMNode } from 'app/types'
import { forEachEntries } from 'utils/common'
import composeParsers from 'utils/composeParsers'

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
 * @param { DOMNode } node
 * @param { NOODLComponentProps } props
 */
export function parseChildren(node: DOMNode, props: NOODLComponentProps) {
  if (props.children) {
    const { children } = props
    if (_.isString(children) || _.isNumber(children)) {
      node.innerHTML += `${children}`
    }
  }
  // Attaching children for the select elem
  else if (props.options) {
    const { options, type } = props
    if (type === 'select') {
      if (_.isArray(options)) {
        _.forEach(options, (option: SelectOption) => {
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
}

/**
 * @param { DOMNode } node
 * @param { NOODLComponentProps } props
 */
export function parseEventHandlers(node: DOMNode, props: NOODLComponentProps) {
  forEachEntries(props, (key, value) => {
    if (eventTypes.includes(key as typeof eventTypes[number])) {
      const eventName = _.find(eventTypes, (k) => k === key)
      const lowercasedEventName = eventName?.toLowerCase()
      console.info(node)
      console.info(node)
      console.info(node)
      console.info(node)
      console.info(node)
      console.info(node)
      console.info(node)
      console.info(node)
      console.info(node)
      if (lowercasedEventName) {
        node.addEventListener(
          lowercasedEventName.startsWith('on')
            ? lowercasedEventName.replace('on', '')
            : lowercasedEventName,
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
  })
}

export function parseStyles(node: DOMNode, props: NOODLComponentProps) {
  if (_.isPlainObject(props.style)) {
    forEachEntries(props.style, (k, v) => {
      node.style[k as any] = v
    })
  } else {
    // log
  }
}

export function parseDataValues(node: DOMNode, props: NOODLComponentProps) {
  if (props['data-value'] != undefined) {
    if (['input', 'select', 'textarea'].includes(props.type)) {
      const elem = node as DataValueElement
      elem.value = props['data-value']
    }
  }
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

export default composeParsers(
  parseChildren,
  parseDataValues,
  parseEventHandlers,
  parseStyles,
)
