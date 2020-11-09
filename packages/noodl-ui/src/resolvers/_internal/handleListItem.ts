import _ from 'lodash'
import Logger from 'logsnap'
import createChild from '../../utils/createChild'
import { IList, IListItem, ResolverFn } from '../../types'
import { event } from '../../constants'

const log = Logger.create('internal[handleListItem')

const handleListItemResolver: ResolverFn = (
  component,
  { resolveComponent },
) => {
  if (component.original?.children) {
    const children = _.isArray(component.original.children)
      ? component.original.children
      : [component.original.children]

    _.forEach(children, (noodlChild) => {
      // const child = resolveComponent(
      //   component.createChild(createChild.call(component, noodlChild)),
      // )
      // child.setParent(component)
      // component.createChild(child)
      log.func('createChild')
      // log.gold('Created a child for listItem', child)
    })
  }
}

export default handleListItemResolver
