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
      'findListDataObject',
      'findParent',
      'getDataValues',
      'identify',
      'isComponent',
      'isListConsumer',
      'isListKey',
      'publish',
    ]),
  )
}
