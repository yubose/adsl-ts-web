import _ from 'lodash'
import produce from 'immer'
import Logger from 'logsnap'
import createComponent from '../../utils/createComponent'
import { forEachEntries } from '../../utils/common'
import { forEachDeepChildren } from '../../utils/noodl'
import {
  IComponentTypeInstance,
  IComponentTypeObject,
  IList,
  IListBlueprint,
  IListItem,
} from '../../types'
import { event } from '../../constants'

const log = Logger.create('internal[handleList]')

const handleListInternalResolver = (component: IList, options, internal) => {
  const { resolveComponent } = options

  const commonProps = {
    listId: component.listId,
    iteratorVar: component.iteratorVar,
  }

  // Keeps blueprint updated
  component.on(event.component.list.BLUEPRINT, (blueprint) => {
    // TODO - Update all list items
  })

  // Creates list items on new data objects
  component.on(event.component.list.ADD_DATA_OBJECT, (result, options) => {
    log.func(`on[${event.component.list.ADD_DATA_OBJECT}]`)

    const listItem = resolveComponent(
      component.createChild(createComponent(component.getBlueprint())),
    ) as IListItem

    log.gold('ADD_DATA_OBJECT', { listItem, ...result })

    if (listItem) {
      listItem.set('listIndex', result.index)
      listItem.setDataObject(result.dataObject)
      // TODO - Decide to keep component implementation
      // component.#items[listItem.id] = { dataObject: result.dataObject, listItem }
      const logArgs = { ...result, listItem }
      log.green(`Created a new listItem`, logArgs)

      internal.resolveChildren(listItem, {
        props: commonProps,
      })

      component.emit(event.component.list.CREATE_LIST_ITEM, logArgs)
    } else {
      log.red(
        `Added a dataObject but there was a problem with creating the list ` +
          `item component`,
        { ...result, listItem },
      )
    }

    listItem.on(event.component.listItem.REDRAW, ({ props }) => {
      log.func('redraw')
      log.grey(`Redrawing listItem`, { props, listItem })
      if (props) {
        forEachDeepChildren(listItem, (child) => {
          forEachEntries(props, (k, v) => child.set(k, v))
        })
      }
      // resolveComponent(listItem)
      // console.info('REDRAWED', listItem)
      listItem.emit(event.component.listItem.REDRAWED, { props, listItem })
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

  component.on(event.component.list.RETRIEVE_DATA_OBJECT, (result, options) => {
    log.func(`on[${event.component.list.RETRIEVE_DATA_OBJECT}]`)
    log.gold(`Retrieved a dataObject`, { result, ...options })
  })

  // Updates list items with new updates to their data object
  component.on(event.component.list.UPDATE_DATA_OBJECT, (result, options) => {
    log.func(`on[${event.component.list.UPDATE_DATA_OBJECT}]`)
    const listItem: IListItem<'list'> | undefined = component.children()?.[
      result.index
    ]
    listItem?.setDataObject?.(result.dataObject)
    log.green(`Updated dataObject`, { result, ...options })
    const args = { ...result, listItem }
    component.emit(event.component.list.UPDATE_LIST_ITEM, args)
  })

  const resolveBlueprint = (noodlComponent: IComponentTypeObject) => {
    const originalChildren = noodlComponent.original.children
    const rawBlueprint = ((_.isString(originalChildren)
      ? { type: originalChildren }
      : _.isArray(originalChildren)
      ? originalChildren[0]
      : _.isPlainObject(originalChildren)
      ? originalChildren
      : originalChildren) || {}) as IComponentTypeObject

    const resolvedBlueprint = resolveComponent(
      rawBlueprint,
    ) as IComponentTypeInstance

    resolvedBlueprint.set('listId', component.listId)
    resolvedBlueprint.set('iteratorVar', component.iteratorVar)

    internal.resolveChildren(resolvedBlueprint, {
      props: commonProps,
    })

    // TODO - find out more keys to filter out
    const untouchedProps = _.filter(
      resolvedBlueprint.untouched,
      (key) => !/(children|listObject)/i.test(key),
    )

    const finalizedBlueprint = produce(resolvedBlueprint.toJS(), (draft) => {
      _.forEach(untouchedProps, (key) => (draft[key] = rawBlueprint[key]))
    })

    return (finalizedBlueprint || {
      type: 'listItem',
    }) as IListBlueprint
  }

  const resolveListItems = (listObject: any[] = [], init?: boolean) => {
    if (listObject.length) {
      // Resetting the list data that was set from the parent prototype so we
      // can re-add them back in so the consumer can get the emitted events
      if (init) component.set('listObject', [])
      const numItems = listObject.length
      for (let index = 0; index < numItems; index++) {
        const dataObject = listObject[index]
        component.addDataObject(dataObject)
        log.green('Saved dataObject', dataObject)
      }
    }
  }

  // Initiate the blueprint
  component.setBlueprint(resolveBlueprint(component))
  // Initiate the listItem children
  resolveListItems(component.getData(), true)
}

export default handleListInternalResolver
