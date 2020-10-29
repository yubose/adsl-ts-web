import _ from 'lodash'
import Logger from 'logsnap'
import { ComponentResolverStateGetters, IComponent } from '../../../types'
import createComponent from '../../../utils/noodl/createComponent'

const log = Logger.create('getListItemBlueprint')

/** Returns the blueprint used for the caller to render list items */
export function getListItemBlueprint({
  component,
  getList,
  listId,
}: {
  component: IComponent
  getList: ComponentResolverStateGetters['getList']
  listId: string
}) {
  let blueprint: any
  let children = component.get('children')

  // Get the blueprint for each list item
  if (_.isArray(children)) {
    // Since listItem components (rows) are not explicity written in the NOODL and
    // gives the responsibility for populating its data to the platforms, this means
    // we need a blueprint to render the items. We can use the first child of the
    // children as its blueprint to render the rest since it is provided at all times
    if (_.isPlainObject(children[0])) {
      blueprint = children[0]
    } else {
      log.red(
        'Attempted to use the first child as the blueprint for rendering list items but it was not an object',
        { component: component.snapshot(), listId, listItems: getList(listId) },
      )
    }
  } else {
    if (_.isObjectLike(children)) {
      // Since there is only one child we can directly use component.children
      // as the props for the child
      blueprint = children
    } else {
      log.red(
        'Attempted to use the single listItem component as the blueprint for rendering list items but it was not an object',
        { component: component.snapshot(), listId, listItems: getList(listId) },
      )
    }
  }
  return _.assign(
    {
      iteratorVar: component.get('iteratorVar'),
      listId,
    },
    blueprint,
  )
}

const _getListItemBlueprint = function (
  component: IComponent,
  { listData, listId }: { listData?: any[]; listId?: string },
) {
  const _iteratorVar = component.get('iteratorVar') || ''
  const _internal = {
    // [_iteratorVar]:
  }

  const _listItems = []

  const o = {
    create() {
      // TODO - calc height
      return createComponent('listItem', {})
    },
  }

  return o
}

export default getListItemBlueprint
