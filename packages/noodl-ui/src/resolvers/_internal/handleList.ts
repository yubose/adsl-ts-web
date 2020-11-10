import _ from 'lodash'
import Logger from 'logsnap'
import createChild from '../../utils/createChild'
import {
  IComponentTypeInstance,
  IList,
  IListItem,
  ResolverFn,
} from '../../types'
import { event } from '../../constants'

const log = Logger.create('internal[handleList]')

const handleListInternalResolver = (function (): ResolverFn {
  let _state = {
    lists: {},
  }

  return (component: IList, options) => {
    const { resolveComponent } = options

    // Keeps blueprint updated
    component.on(event.component.list.BLUEPRINT, (blueprint) => {
      // TODO - Update all list items
    })

    // Creates list items on new data objects
    component.on(event.component.list.ADD_DATA_OBJECT, (result, options) => {
      log.func(`on[${event.component.list.ADD_DATA_OBJECT}]`)

      const listItem = component.createChild(
        resolveComponent(component.getBlueprint()) as IComponentTypeInstance,
      ) as IListItem

      log.gold('ADD_DATA_OBJECT', { listItem, ...result })

      if (listItem) {
        listItem.set('listIndex', result.index)
        listItem.setDataObject(result.dataObject)
        // TODO - Decide to keep component implementation
        // component.#items[listItem.id] = { dataObject: result.dataObject, listItem }
        const logArgs = { ...result, listItem }
        log.green(`Created a new listItem`, logArgs)
        component.emit(event.component.list.CREATE_LIST_ITEM, logArgs)
      } else {
        log.red(
          `Added a dataObject but there was a problem with creating the list ` +
            `item component`,
          { ...result, listItem },
        )
      }

      listItem.on('redraw', () => {
        // resolveComponent(listItem)
        console.info('REDRAWED', listItem)
      })

      // listItem.emit('redraw')
    })

    // Removes list items when their data object is removed
    component.on(event.component.list.DELETE_DATA_OBJECT, (result, options) => {
      log.func(`on[${event.component.list.DELETE_DATA_OBJECT}]`)
      const listItem = component.find(
        (child) => child?.getDataObject?.() === result.dataObject,
      )
      if (listItem) component.removeChild(listItem)
      log.green(`Deleted a listItem`, { ...result, ...options, listItem })
      const args = { ...result, listItem }
      component.emit(event.component.list.REMOVE_LIST_ITEM, args)
    })

    component.on(
      event.component.list.RETRIEVE_DATA_OBJECT,
      (result, options) => {
        log.func(`on[${event.component.list.RETRIEVE_DATA_OBJECT}]`)
        log.gold(`Retrieved a dataObject`, { result, ...options })
      },
    )

    // Updates list items with new updates to their data object
    component.on(event.component.list.UPDATE_DATA_OBJECT, (result, options) => {
      log.func(`on[${event.component.list.UPDATE_DATA_OBJECT}]`)
      const listItem: IListItem<'list'> | undefined = component.children()?.[
        result.index
      ]
      listItem?.setDataObject(result.dataObject)
      log.green(`Updated dataObject`, { result, ...options })
      component.emit(event.component.list.UPDATE_LIST_ITEM, {
        ...result,
        listItem,
      })
    })

    // Initiate the component
    if (!_state[component.id]?.initiated) {
      const listObject = component.getData() || []

      log.grey(`Initiating list internal resolver's listObject`, {
        component: component.toJS(),
        listObject,
        ...options,
      })

      if (listObject?.length) {
        _.forEach(listObject, (dataObject) => {
          // TODO - Do a more official way to remove the placeholder
          if (component.get('listObject')?.length === 1) {
            component.removeDataObject(0)
          }
          component.addDataObject(dataObject)
          log.green(`Saved dataObject`, dataObject)
        })
      }

      _state[component.id] = { initiated: true }
    } else {
      console.info(
        `List internal resolver's listObject was already instantiated`,
        {
          component: component.toJS(),
          listObject: component.getData(),
          ...options,
        },
      )
    }
  }
})()

export default handleListInternalResolver
