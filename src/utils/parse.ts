import _ from 'lodash'
import {
  eventTypes,
  isReference,
  NOODLComponentProps,
  NOODLActionTriggerType,
  SelectOption,
} from 'noodl-ui'
import { DataValueElement, DOMNode } from 'app/types'
import { forEachEntries } from 'utils/common'
import createParser from './createParser'

/**
 * Handles the parsing and displaying of assets/media
 * @param { DOMNode } node
 * @param { NOODLComponentProps } props
 */
export function parseAssets(node: DOMNode, props: NOODLComponentProps) {
  if (props.src) {
    node.setAttribute('src', props.src)
  }
  if (props.type === 'video') {
    if (props.poster) {
      node.setAttribute('poster', props.poster)
    }
    if (props.videoFormat) {
      node.setAttribute('type', props.videoFormat)
    }
  }
}

/**
 * Handles innerHTML and other display content that is not managed by some "onchange"
 * event, or in other words displays static content once they have been parsed
 * @param { DOMNode } node
 * @param { NOODLComponentProps } props
 */
export function parseChildren(node: DOMNode, props: NOODLComponentProps) {
  if (props.children) {
    const { children } = props
    if (_.isString(children) || _.isNumber(children)) {
      node.innerHTML += `${children}`
    } else if (_.isArray(children)) {
      if (props['data-list-id']) {
        // Since the NOODL data doesn't return us the complete list of "listItem"
        // components, this means we need to handle them customly. The noodl-ui
        // lib hands us a "blueprint" which is intended to be used with the list
        // items that we will create
        const blueprint = props.blueprint
        const listId = props['data-list-id']
        const listData = props['data-list-data']
        const elems = listData?.map((item) => {
          const childNode = document.createElement(blueprint.type) as DOMNode
          return childNode
        })
        if (elems) {
        }
      }
    }
  }
  // Attaching children for the select elem
  if (props.options) {
    const { options, type } = props
    if (type === 'select') {
      if (_.isArray(options)) {
        _.forEach(options, (option: SelectOption) => {
          if (option) {
            const optionElem = document.createElement('option')
            optionElem['id'] = option.key
            optionElem['value'] = option?.value
            optionElem['innerText'] = option.label
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
  if (props.type === 'video') {
    const sourceEl = document.createElement('source')
    sourceEl['src'] = props.src || ''
  }
}

/**
 * Attaches event handlers like "onclick" and "onchange"
 * @param { DOMNode } node
 * @param { NOODLComponentProps } props
 */
export function parseEventHandlers(node: DOMNode, props: NOODLComponentProps) {
  forEachEntries(props, (key, value) => {
    if (eventTypes.includes(key as NOODLActionTriggerType)) {
      const isEqual = (k: NOODLActionTriggerType) => k === key
      const eventName = _.find(eventTypes, isEqual)
      const lowercasedEventName = eventName?.toLowerCase?.() || ''
      if (lowercasedEventName) {
        // Attach the event handler
        node.addEventListener(
          lowercasedEventName.startsWith('on')
            ? lowercasedEventName.replace('on', '')
            : lowercasedEventName,
          value,
        )
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

/**
 * Applies styles using the "style" object
 * @param { HTMLElement } node - HTML element
 * @param { NOODLComponentProps } props
 */
export function parseStyles(node: DOMNode, props: NOODLComponentProps) {
  if (_.isPlainObject(props.style)) {
    forEachEntries(props.style, (k, v) => {
      node.style[k as any] = v
    })
  } else {
    console.log(
      `%c[parse.ts][parseStyles] ` +
        `Expected a style object but received ${typeof props.style} instead`,
      `color:#ec0000;font-weight:bold;`,
      props.style,
    )
  }
}

/**
 * NOTE: For select elements, this needs to be run when they have options
 * as children, otherwise their value will not update
 * Applies data values for dom nodes that display data. Most likely elements
 * that expose an "onchange" event such as an input element
 * @param { HTMLElement } node - HTML element
 * @param { NOODLComponentProps } props
 */
export function parseDataValues(node: DOMNode, props: NOODLComponentProps) {
  if (props['data-value'] != undefined) {
    if (['input', 'select', 'textarea'].includes(props.type)) {
      let elem = node as DataValueElement
      elem['value'] = props['data-value']
      if (props.type === 'select') {
        elem = node as HTMLSelectElement
        if (elem.length) {
          // Put the default value to the first option in the list
          elem.selectedIndex = 0
        }
        if (!props.options) {
          const logMsg =
            `%c[parseDataValues] ` +
            `Attempted to attach a data-value to a select element's value but ` +
            `"options" was not provided. This may not display its value as expected`
          console.log(logMsg, `color:#ec0000;font-weight:bold;`, props)
        }
      }
    }
  }
}

function parseIdentifiers(node: DOMNode, props: NOODLComponentProps) {
  if (props.id) {
    node['id'] = props.id
  }
  console.log(props)

  if (props['data-key']) {
    if ('name' in node) {
      node.setAttribute('data-key', props['data-key'])
      node.setAttribute('name', props['data-key'])
    }
  }
  if (props['data-list-id']) {
    node.setAttribute('list-id', props['data-list-id'])
  }
  // TODO: Rethink if we should attach this to the DOM or manage this in memory instead
  if (props['data-list-data']) {
    node.setAttribute('data-list-data', JSON.stringify(props['data-list-data']))
  }
  if (props['data-name']) {
    node.setAttribute('data-name', props['data-name'])
  }
  if (props['data-ux']) {
    node.setAttribute('data-ux', props['data-ux'])
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

export default createParser(
  parseIdentifiers,
  parseAssets,
  parseChildren,
  parseDataValues,
  parseEventHandlers,
  parseStyles,
)
