import _ from 'lodash'
import { NOODLComponentType, IComponentTypeInstance } from '../../types'
import { isTextBoardComponent } from 'noodl-utils'
import Resolver from '../../Resolver'
import handleList from './handleList'
import handleTextBoard from './handleTextBoard'

/**
 * Certain components have unique logic to them like list/listItems/textBoard, etc.
 * This resolver takes care of making sure they do what they are expected to do as
 * defined in the NOODL specs
 */

const _internalResolvers = new Resolver()

_internalResolvers.setResolver((component, options) => {
  const handle = _getHandler(component)
  if (_.isFunction(handle)) handle(component, options)
})

_internalResolvers.internal = true

// TODO - composed approach with transducers / multiple wrappers
function _getHandler(component: IComponentTypeInstance) {
  switch (component.noodlType) {
    case 'list':
      return handleList
    default:
      break
  }

  // TODO - proxied component --> component instance
  if (isTextBoardComponent(component)) {
    return handleTextBoard
  }
}

export default _internalResolvers
