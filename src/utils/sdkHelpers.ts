/**
 * Utilities for the SDK client is moved into this file because they are
 * currently breaking tests when being imported. To prevent this, we can
 * isolate the imports into this file and replace them with stubs in testing
 */
import { Draft, original } from 'immer'
import has from 'lodash/has'
import set from 'lodash/set'
import upperFirst from 'lodash/upperFirst'
import Logger from 'logsnap'
import { excludeIteratorVar, getAllByDataKey, isEmitObj } from 'noodl-utils'
import {
  Component,
  findListDataObject,
  isListConsumer,
  isListKey,
  NOODLUI as NUI,
  NOODLUIActionChain,
} from 'noodl-ui'
import { isTextFieldLike, NOODLDOMDataValueElement } from 'noodl-ui-dom'
import noodl from '../app/noodl'

const log = Logger.create('sdkHelpers.ts')

/**
 * This returns a function that is intended to be placed on a "data value"
 * element's "onchange" event (Like input elements)
 * @param { HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement } node
 * @param { Component } component - Component instance
 * @param { object } options
 * @param { string } options.eventName
 * @param { function | undefined } options.onChange - onChange callback. This is most likely the function returned from ActionChain#build
 */
export function createOnDataValueChangeFn(
  node: NOODLDOMDataValueElement,
  component: Component,
  {
    eventName,
    onChange: onChangeProp,
  }: { eventName: 'onchange'; onChange?: NOODLUIActionChain },
) {
  log.func('createOnDataValueChangeFn')
  let iteratorVar = component.get('iteratorVar') || ''
  let dataKey = component.get('data-key') || component.get('dataKey') || ''

  // Initiates the values
  node.value = component.get('data-value') || ''
  node.dataset.value = component.get('data-value') || ''

  if (node.tagName === 'SELECT') {
    if ((node as HTMLSelectElement).length) {
      // Put the default value to the first option in the list
      ;(node as HTMLSelectElement)['selectedIndex'] = 0
    }
  }

  const onChange = async (event: Event) => {
    const target:
      | (typeof event.target & {
          value?: string
        })
      | null = event.target

    const localRoot = noodl?.root?.[NUI.getRootPage().page]
    const value = target?.value || ''

    if (isListKey(dataKey, component)) {
      const dataObject = findListDataObject(component)
      if (dataObject) {
        set(dataObject, excludeIteratorVar(dataKey, iteratorVar), value)
        component.set('data-value', value)
        node.dataset.value = value
      } else {
        log.red(
          'Expected a dataObject to update from onChange but no dataObject was found',
          { component, node, dataKey, currentValue: value, event, eventName },
        )
      }
      // TODO - Come back to this to provide more robust functionality
      if (isEmitObj(component.get('dataValue'))) {
        await onChangeProp?.execute?.(event)
      }
    } else {
      noodl.editDraft((draft: Draft<{ [key: string]: any }>) => {
        if (!has(draft?.[NUI.getRootPage().page], dataKey)) {
          log.orange(
            `Warning: The dataKey path ${dataKey} does not exist in the local root object ` +
              `If this is intended then ignore this message.`,
            {
              component,
              dataKey,
              draftRoot: original(draft),
              localRoot,
              node,
              pageName: NUI.getRootPage().page,
              pageObject: noodl.root[NUI.getRootPage().page],
              value,
            },
          )
        }
        set(draft?.[NUI.getRootPage().page], dataKey, value)
        component.set('data-value', value)
        node.dataset.value = value

        if (!isListConsumer(component)) {
          /**
           * EXPERIMENTAL - When a data key from the local root is being updated
           * by a node, update all other nodes that are referencing it.
           * Note: This will not work for list items which is fine because they
           * reference their own data objects
           */
          const linkedNodes = getAllByDataKey(dataKey)
          if (linkedNodes.length) {
            linkedNodes.forEach((node) => {
              // Since select elements have options as children, we should not
              // edit by innerHTML or we would have to unnecessarily re-render the nodes
              if (node.tagName === 'SELECT') {
                // TODO - handle this
              } else if (isTextFieldLike(node)) {
                node.dataset['value'] = value
              } else {
                node.innerHTML = `${value || ''}`
              }
            })
          }
        }
      })
      await onChangeProp?.execute?.(event)
    }
  }

  return onChange
}

/** Handles onClick events for "goTo" handling.
 *    Ex: A NOODL page gives an onClick a value of "goToDashboard"
 *     The underlying function here will take a path string/regex and find a matching
 *     page path from the config, and will return the path if found.
 *     Otherwise it will return an empty string
 * @param { string } pageName
 */
export function getPagePath(pageName: string | RegExp) {
  // @ts-expect-error
  const pages = noodl?.cadlEndpoint?.page || noodl?.noodlEndpoint?.page || []
  const pagePath = pages.find((name: string) =>
    typeof pageName === 'string'
      ? name.includes(pageName)
      : pageName instanceof RegExp
      ? pageName.test(name)
      : false,
  )
  // Ensure the first letter is capitalized
  return pagePath ? upperFirst(pagePath) : ''
}
