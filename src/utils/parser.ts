import _ from 'lodash'
import {
  eventTypes,
  isReference,
  NOODLComponentProps,
  NOODLActionTriggerType,
  SelectOption,
} from 'noodl-ui'
import NOODLDOMParser from 'app/noodl-ui-dom'
import { DataValueElement, NOODLElement } from 'app/types'
import { cadl, noodl } from 'app/client'
import { forEachEntries } from 'utils/common'
import Logger from 'app/Logger'

const log = Logger.create('parser.ts')

export interface ParserOptions {
  parse: (props: NOODLComponentProps) => NOODLElement
}

/**
 * Handles the parsing and displaying of assets/media
 * @param { NOODLElement } node
 * @param { NOODLComponentProps } props
 */
export function parseAssets(node: NOODLElement, props: NOODLComponentProps) {
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
 * @param { NOODLElement } node
 * @param { NOODLComponentProps } props
 */
export function parseChildren(
  node: NOODLElement,
  props: NOODLComponentProps,
  options: { parse: (props: NOODLComponentProps) => NOODLElement },
) {
  if (props.children) {
    // Since the NOODL data doesn't return us the complete list of "listItem"
    // components, this means we need to handle them customly. The noodl-ui
    // lib hands us a "blueprint" which is intended to be used with the list
    if (props.noodlType === 'list') {
      // subparsers.parseList(node, props, options)
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
 * @param { NOODLElement } node
 * @param { NOODLComponentProps } props
 */
export function parseEventHandlers(
  node: NOODLElement,
  props: NOODLComponentProps,
) {
  forEachEntries(props, (key, value) => {
    if (eventTypes.includes(key as NOODLActionTriggerType)) {
      const isEqual = (k: NOODLActionTriggerType) => k === key
      const eventName = _.find(eventTypes, isEqual)
      const lowercasedEventName = eventName?.toLowerCase?.() || ''
      const directEventName = lowercasedEventName.startsWith('on')
        ? lowercasedEventName.replace('on', '')
        : lowercasedEventName
      if (directEventName) {
        // TODO: Test this
        const eventFn = async (...args: any[]) => {
          await value(...args)
          node.removeEventListener(directEventName, eventFn)
          node.addEventListener(directEventName, eventFn)
        }
        // Attach the event handler
        node.addEventListener(directEventName, eventFn)
      }
    }
    if (key === 'data-value') {
      /**
       * EXPERIMENTAL AND WILL BE MOVED TO A BETTER LOCATION IF IT IS
       * AN ACCEPTED SOLUTION
       */
      const onChange = parser.createOnChangeFactory?.(
        props['data-key'] as string,
      )()
      if (!_.isFunction(onChange)) {
        log.func('parseEventHandlers').red('onChange is not a function')
      }
      node.addEventListener('change', onChange)
    }
  })
}

/**
 * Applies styles using the "style" object
 * @param { HTMLElement } node - HTML element
 * @param { NOODLComponentProps } props
 */
export function parseStyles(node: NOODLElement, props: NOODLComponentProps) {
  if (_.isPlainObject(props.style)) {
    forEachEntries(props.style, (k, v) => {
      node.style[k as any] = v
    })
  } else {
    log.func('parseStyles')
    log.red(
      `Expected a style object but received ${typeof props.style} instead`,
      props.style,
    )
  }
  // Remove the default padding since the NOODL was designed without
  // expecting a padding default (which defaults to padding-left:"40px")
  if (props.type === 'ul') {
    node.style['padding'] = '0px'
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
export function parseDataValues(
  node: NOODLElement,
  props: NOODLComponentProps,
) {
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
          log.func('parseDataValues')
          log.red(
            `Attempted to attach a data-value to a select element's value but ` +
              `"options" was not provided. This may not display its value as expected`,
            props,
          )
        }
      }
    } else {
      // Defaulting to normal display components like labels for now
      node.innerHTML = props['data-value']
    }
  }
}

function parseIdentifiers(node: NOODLElement, props: NOODLComponentProps) {
  if (props.id) {
    node['id'] = props.id
  }
  if (props['data-key']) {
    if ('name' in node) {
      node.dataset['key'] = props['data-key']
      node.dataset['name'] = props['data-key']
    }
  }
  if (props['data-listid']) {
    node.dataset['listid'] = props['data-listid']
  }
  if (props['data-name']) {
    node.dataset['name'] = props['data-name']
  }
  if (props['data-ux']) {
    node.dataset['ux'] = props['data-ux']
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

const parser = new NOODLDOMParser()

parser
  .add(parseIdentifiers)
  .add(parseAssets)
  .add(parseChildren as any)
  .add(parseDataValues)
  .add(parseEventHandlers)
  .add(parseStyles)

export default parser
