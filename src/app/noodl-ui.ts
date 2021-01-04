import pick from 'lodash/pick'
import { findReferences } from 'noodl-utils'
import {
  getByDataUX,
  getDataAttribKeys,
  getDynamicShapeKeys,
  getShape,
  getShapeKeys,
} from 'noodl-ui-dom'
import * as lib from 'noodl-ui'

const noodlui = new lib.NOODL()

/**
 * Just a helper to return the utilities that are meant to be attached
 * to the global window object
 */
export function getWindowHelpers() {
  return Object.assign(
    {
      findReferences,
      getByDataUX,
      getDataAttribKeys,
      getDynamicShapeKeys,
      getShape,
      getShapeKeys,
    },
    pick(lib, [
      'findChild',
      'findList',
      'findListDataObject',
      'findParent',
      'getDataValues',
      'identify',
      'isComponent',
      'isListConsumer',
      'isListKey',
      'isPromise',
      'isReference',
      'publish',
    ]),
  )
}

export default noodlui
