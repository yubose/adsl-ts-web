import pick from 'lodash/pick'
import {
  findByDataAttrib,
  findByDataKey,
  findByElementId,
  findByGlobalId,
  findByPlaceholder,
  findBySelector,
  findBySrc,
  findByViewTag,
  findByUX,
  findWindow,
  findWindowDocument,
  getByDataUX,
} from 'noodl-ui-dom'
import * as lib from 'noodl-ui'
import { findReferences } from 'noodl-utils'
import { getVcodeElem, toast } from '../utils/dom'

/**
 * Just a helper to return the utilities that are meant to be attached
 * to the global window object
 */
export function getWindowHelpers() {
  return Object.assign(
    {
      findByDataAttrib,
      findByDataKey,
      findByElementId,
      findByGlobalId,
      findByPlaceholder,
      findBySelector,
      findBySrc,
      findByViewTag,
      findByUX,
      findReferences,
      findWindow,
      findWindowDocument,
      getVcodeElem,
      getByDataUX,
      toast,
    },
    pick(lib, [
      'findChild',
      'findIteratorVar',
      'findListDataObject',
      'findParent',
      'flatten',
      'getDataValues',
      'getLast',
      'parseReference',
      'publish',
      'resolveAssetUrl',
    ]),
  )
}
