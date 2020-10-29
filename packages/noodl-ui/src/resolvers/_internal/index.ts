import _ from 'lodash'
import { NOODLComponentType } from '../../types'
import Resolver from '../../Resolver'
import handleList from './handleList'

/**
 * Certain components have unique logic to them like list/listItems/textBoard, etc.
 * This resolver takes care of making sure they do what they are expected to do as
 * defined in the NOODL specs
 */

const _internalResolvers = new Resolver()

_internalResolvers.setResolver((component, options) => {
  const handle = _getHandler(component.noodlType)
  if (_.isFunction(handle)) handle(component, options)
})

_internalResolvers.internal = true

function _getHandler(noodlType: NOODLComponentType) {
  switch (noodlType) {
    case 'list':
      return handleList
    default:
      return
  }
}

export default _internalResolvers
