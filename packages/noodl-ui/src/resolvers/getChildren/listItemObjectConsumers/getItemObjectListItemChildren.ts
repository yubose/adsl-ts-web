// Currently this is being used to render any children who have a dataKey that
// begins with "itemObject" which are known to be inside list components
import _ from 'lodash'
import Logger from 'logsnap'
import Component from '../../../components/Base'
import { IComponent, ResolverOptions, ConsumerOptions } from '../../../types'

const log = Logger.create('getIteratorVarListItemChildren')

/**
 * Renders children who hold a dataKey that is in direct reference to some itemObject
 * example: { dataKey: 'itemObject.name.roomName' }
 */
function getIteratorVarListItemChildren(
  component: IComponent,
  options: ConsumerOptions & { resolverOptions: ResolverOptions },
) {
  const { getList, getListItem, showDataKey } = options
  const {
    dataKey,
    iteratorVar = '',
    listId = '',
    listItemIndex = 0,
  } = component.get(['iteratorVar', 'listId', 'listItemIndex', 'dataKey'])

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
        iteratorVar,
        listData: getList(listId as string),
        listId,
        listItem,
        listItemIndex,
      },
    )
    // Apply the raw data key to the UI for debugging purposes
    component.createChild(new Component({ type: 'label', text: dataKey }))
  } else {
    if (_.isPlainObject(listItem)) {
      if (_.isString(dataKey)) {
        // TODO: Use iteratorVar
        if (dataKey.startsWith('itemObject')) {
          // TODO: Investigate this next line
          component.createChild(parent?.get('itemObject'))
        }
      }
    } else {
      if (listItem) {
        component.createChild(listItem)
      }
    }
  }
}

export default getIteratorVarListItemChildren
