// !NOTE - Internal resolvers are on halt for now
// @ts-nocheck

import _ from 'lodash'
import { IComponentTypeInstance } from '../../types'
import { isTextBoardComponent } from 'noodl-utils'
import Resolver from '../../Resolver'
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
    default:
      break
  }

  // TODO - proxied component --> component instance
  if (isTextBoardComponent(component)) {
    return handleTextBoard
  }
}

export default _internalResolvers
