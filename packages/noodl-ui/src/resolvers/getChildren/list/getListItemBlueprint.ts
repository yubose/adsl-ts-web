import _ from 'lodash'
import Logger from 'logsnap'
import { INOODLUiStateGetters, IComponent } from '../../../types'
import Component from '../../../Component'

const log = Logger.create('getListItemBlueprint')

/** Returns the blueprint used for the caller to render list items */
export function getListItemBlueprint({
  component,
  getList,
  listId,
}: {
  component: IComponent
  getList: INOODLUiStateGetters['getList']
  listId: string
}) {
  let blueprint: any
  let noodlChildren = component.get('children')
  // Get the blueprint for each list item
  if (_.isArray(noodlChildren)) {
    // Since listItem components (rows) are not explicity written in the NOODL and
    // gives the responsibility for populating its data to the platforms, this means
    // we need a blueprint to render the items. We can use the first child of the
    // noodlChildren as its blueprint to render the rest since it is provided at all times
    if (_.isPlainObject(noodlChildren[0])) {
      blueprint = noodlChildren[0]
    } else {
      log.red(
        'Attempted to use the first child as the blueprint for rendering list items but it was not an object',
        { component: component.snapshot(), listId, listItems: getList(listId) },
      )
    }
  } else {
    if (_.isObjectLike(noodlChildren)) {
      // Since there is only one child we can directly use component.noodlChildren
      // as the props for the child
      blueprint = noodlChildren
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
      return new Component({ type: 'listItem' })
    },
  }

  return o
}

export default getListItemBlueprint
