import pick from 'lodash/pick'
import {
  findByElementId,
  findByViewTag,
  findWindow,
  findWindowDocument,
  getByDataUX,
  getDataAttribKeys,
  getDynamicShapeKeys,
  getShape,
  getShapeKeys,
} from 'noodl-ui-dom'
import * as lib from 'noodl-ui'
import { findReferences } from 'noodl-utils'
import { toast } from '../utils/dom'

const noodlui = new lib.NOODL()

/**
 * Just a helper to return the utilities that are meant to be attached
 * to the global window object
 */
export function getWindowHelpers() {
  return Object.assign(
    {
      findReferences,
      findByElementId,
      findByViewTag,
      findWindow,
      findWindowDocument,
      getByDataUX,
      getDataAttribKeys,
      getDynamicShapeKeys,
      getShape,
      getShapeKeys,
      toast,
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
