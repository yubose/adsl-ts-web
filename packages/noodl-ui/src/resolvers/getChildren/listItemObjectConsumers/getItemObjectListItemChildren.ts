// Currently this is being used to render any children who have a dataKey that
// begins with "itemObject" which are known to be inside list components
import _ from 'lodash'
import {
  IComponent,
  ResolverOptions,
  ResolverConsumerOptions,
} from '../../../types'
import Logger from '../../../Logger'

const log = Logger.create('getListItemItemObjectConsumers')

/**
 * Renders children who hold a dataKey that is in direct reference to some itemObject
 * example: { dataKey: 'itemObject.name.roomName' }
 */
function getListItemItemObjectConsumers(
  component: IComponent,
  options: ResolverConsumerOptions & { resolverOptions: ResolverOptions },
) {
  const { getList, getListItem, showDataKey } = options
  const { dataKey, listId = '', listItemIndex = 0 } = component.get([
    'listId',
    'listItemIndex',
    'dataKey',
  ])

  const parent = component.parent()
  const listItem = getListItem(listId as string, listItemIndex as number)

  if (!listItem) {
    log.red(
      `A component attempted to retrieve list item data but none could be found. ` +
        showDataKey
        ? `The page will display "${dataKey}" instead`
        : '',
      {
        component: component.snapshot(),
        listData: getList(listId as string),
        listId,
        listItem,
        listItemIndex,
      },
    )
    // Apply the raw data key to the UI for debugging purposes
    component.set('children', dataKey)
  } else {
    if (_.isPlainObject(listItem)) {
      if (_.isString(dataKey)) {
        // TODO: Use iteratorVar
        if (dataKey.startsWith('itemObject')) {
          // TODO: Investigate this next line
          component.set('children', parent.get('itemObject'))
        }
      }
    } else {
      if (listItem) {
        component.set('children', listItem)
      }
    }
  }
}

export default getListItemItemObjectConsumers
