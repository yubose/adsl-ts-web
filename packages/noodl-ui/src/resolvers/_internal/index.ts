import _ from 'lodash'
import Logger from 'logsnap'
import handleList from './handleList'
import handleTextboard from './handleTextboard'
import Resolver from '../../Resolver'
import { _resolveChildren } from './helpers'
import { IComponentTypeInstance, IList } from '../../types'

const log = Logger.create('_internalResolver')

/**
 * These resolvers are used internally by the lib. They handle all the logic
 * as defined in the NOODL spec and they're responsible for ensuring that
 * the components are behaving as expected behind the scenes
 */
const _internalResolver = new Resolver()

_internalResolver.setResolver((component, options) => {
  const { resolveComponent } = options

  /**
   * Deeply parses every child node in the tree
   * @param { IComponentTypeInstance } c
   */
  const resolveChildren = (c: IComponentTypeInstance) => {
    _resolveChildren(c, {
      onResolve: (child) => {
        if (child) {
          if (child.noodlType === 'list') {
            return handleList(child as IList, options, _internalResolver)
          }
          if (child.get('textBoard')) {
            return handleTextboard(child, options, _internalResolver)
          }
          return resolveChildren(child)
        }
      },
      resolveComponent,
    })
  }

  resolveChildren(component)
})

_internalResolver.internal = true

export default _internalResolver
