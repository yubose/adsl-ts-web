import Logger from 'logsnap'
import isPlainObject from 'lodash/isPlainObject'
import has from 'lodash/has'
import get from 'lodash/get'
import set from 'lodash/set'
import { findDataValue } from 'noodl-utils'
import { ComponentInstance, ConsumerOptions } from '../../types'
import {
  findListDataObject,
  findParent,
  isListConsumer,
} from '../../utils/noodl'
import { _resolveChildren } from './helpers'

const log = Logger.create('handleTimer')

const handleTimer = (
  component: ComponentInstance,
  options: ConsumerOptions,
) => {
  const { context, getPageObject, getRoot } = options

  let dataKey = component.get('dataKey') || ''
  let dataObject: any
  let dataValue: any

  if (dataKey) {
    let isPageDescendant
    let isListDescendant = isListConsumer(component)

    findParent(component, (p) => {
      if (p?.noodlType === 'page') return (isPageDescendant = true)
      return false
    })

    if (isListDescendant) {
      dataObject = findListDataObject(component)
      if (!has(dataObject, dataKey)) {
        log.red(
          `A path does not exist at ${dataKey}. Skipping the query and moving to higher level now...`,
          { component, dataKey, dataObject, options },
        )
      } else {
        log.green(
          `The path ${dataKey} exists in a data object. Retrieving its value from there now...`,
          { dataObject, dataKey },
        )
        dataValue = get(dataObject, dataKey)
      }
    }

    if (dataValue !== undefined) {
      log.green(`Received data value`, {
        component,
        options,
        dataKey,
        dataObject,
        dataValue,
      })
    } else {
      dataObject = findDataValue(
        [() => getRoot(), () => getPageObject(context.page)],
        dataKey,
      )

      if (isPlainObject(dataObject)) {
        dataValue = get(dataObject, dataKey)
      } else {
        dataValue = dataObject
      }
    }

    if (dataValue === undefined) {
      log.red(
        `No data object or value could be found. `,
        // `No data object or value could be found. Defaulting to overriding and setting the key/value at: ${dataKey}`,
        { component, options, dataKey, dataObject, dataValue },
      )
      // // TODO - Start the timer at 00:00 ?
      // set(dataObject, dataKey, '00:00')
    } else {
      log.green('A data value exists in the root/local object level', {
        component,
        options,
        dataKey,
        dataObject,
        dataValue,
      })

      set(dataObject, dataKey, dataValue)
    }
  }
}

export default handleTimer
