import _ from 'lodash'
import { isComponentInstance } from 'noodl-utils'
import createChild from '../../utils/createChild'
import handleList from './handleList'
import handleListItem from './handleListItem'
import Resolver from '../../Resolver'
import { forEachDeepChildren } from '../../utils/noodl'
import {
  IComponentType,
  IComponentTypeInstance,
  IComponentTypeObject,
  IList,
  IListItem,
} from '../../types'

/**
 * These resolvers are used internally by the lib. They handle all the logic
 * as defined in the NOODL spec and they're responsible for ensuring that
 * the components are behaving as expected behind the scenes
 */
const _internalResolver = new Resolver()

_internalResolver.setResolver((component, options) => {
  const { resolveComponent } = options

  function fn(
    parent: IComponentTypeInstance | IComponentTypeObject,
    child: IComponentType,
  ) {
    if (isComponentInstance(child)) {
      const c = child as IComponentTypeInstance
      if (c.noodlType === 'list') {
        handleList(c as IList, options)
      } else if (c.noodlType === 'listItem') {
        handleListItem(c as IListItem, options)
      } else {
        const originalChildren = c.original?.children
        if (_.isArray(originalChildren)) {
          _.forEach(originalChildren, (oc) => {
            resolveComponent(parent.createChild(createChild.call(parent, oc)))
            fn(parent, oc)
          })
        } else fn(parent, originalChildren as any)
      }
    } else {
      if (_.isString(child) || _.isPlainObject(child)) {
        resolveComponent(parent.createChild(createChild.call(parent, child)))
      }
    }
  }

  forEachDeepChildren(component, fn)
})

_internalResolver.internal = true

export default _internalResolver
