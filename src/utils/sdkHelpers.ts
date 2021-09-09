/**
 * Utilities for the SDK client is moved into this file because they are
 * currently breaking tests when being imported. To prevent this, we can
 * isolate the imports into this file and replace them with stubs in testing
 */
import { Draft, original } from 'immer'
import { ActionChain } from 'noodl-action-chain'
import has from 'lodash/has'
import set from 'lodash/set'
import upperFirst from 'lodash/upperFirst'
import Logger from 'logsnap'
import { excludeIteratorVar, getAllByDataKey, isEmitObj } from 'noodl-utils'
import {
  Component,
  findListDataObject,
  findIteratorVar,
  isListConsumer,
  isListKey,
} from 'noodl-ui'
import { isTextFieldLike } from 'noodl-ui-dom'
import App from '../App'

const log = Logger.create('sdkHelpers.ts')

/**
 * This returns a function that is intended to be placed on a "data value"
 * element's "onchange" event (Like input elements)
 * @param { HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement } node
 * @param { Component } component - Component instance
 * @param { object } options
 * @param { string } options.eventName
 * @param { ActionChain | undefined } options.onChange - onChange callback. This is most likely the function returned from ActionChain#build
 */
export function createOnDataValueChangeFn(
  node: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  component: Component,
  {
    app,
    eventName,
    onChange: actionChain,
  }: { app: App; eventName: 'onchange'; onChange?: ActionChain },
) {
  log.func('createOnDataValueChangeFn')
  let iteratorVar = findIteratorVar(component)
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

  const onChange = async function _onChange(event: Event) {
    const pageName = app.noodlui.getRootPage().page
    const target:
      | (typeof event.target & {
          value?: string
        })
      | null = event.target

    const localRoot = app.noodl?.root?.[pageName]
    const value = target?.value || ''

    if (isListKey(dataKey, component)) {
      const dataObject = findListDataObject(component)
      if (dataObject) {
        set(dataObject, excludeIteratorVar(dataKey, iteratorVar), value)
        component.edit((props) => void (props['data-value'] = value))
        node.dataset.value = value
      } else {
        log.red(
          'Expected a dataObject to update from onChange but no dataObject was found',
          { component, node, dataKey, currentValue: value, event, eventName },
        )
      }
      // TODO - Come back to this to provide more robust functionality
      if (isEmitObj(component.get('dataValue'))) {
        await actionChain?.execute.call(actionChain, event)
      }
    } else {
      app.noodl.editDraft((draft: Draft<{ [key: string]: any }>) => {
        if (!has(draft?.[pageName], dataKey)) {
          log.orange(
            `Warning: The dataKey path ${dataKey} does not exist in the local root object ` +
              `If this is intended then ignore this message.`,
            {
              component,
              dataKey,
              draftRoot: original(draft),
              localRoot,
              node,
              pageName,
              pageObject: app.noodl.root[pageName],
              value,
            },
          )
        }
        set(draft?.[pageName], dataKey, value)
        component.edit({ 'data-value': value })
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
      actionChain?.execute?.call(actionChain, event)
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
