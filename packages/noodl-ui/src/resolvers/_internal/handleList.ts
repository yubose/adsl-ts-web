import _ from 'lodash'
import produce from 'immer'
import Logger from 'logsnap'
import { findParent, getDataValue } from 'noodl-utils'
import { forEachEntries } from '../../utils/common'
import { forEachDeepChildren, isListItemComponent } from '../../utils/noodl'
import {
  IComponentTypeInstance,
  IComponentTypeObject,
  IList,
  IListBlueprint,
  IListItem,
} from '../../types'
import { event } from '../../constants'
import createComponent from '../../utils/createComponent'
import { _resolveChildren } from './helpers'

const log = Logger.create('internal[handleList]')

const handleListInternalResolver = (
  component: IList,
  options,
  _internalResolver,
) => {
  const { resolveComponent } = options

  const commonProps = {
    listId: component.listId,
    iteratorVar: component.iteratorVar,
  }

  // Creates list items on new data objects
  component.on(event.component.list.ADD_DATA_OBJECT, (result, options) => {
    log.func(`on[${event.component.list.ADD_DATA_OBJECT}]`)

    const listItem = component.createChild(
      createComponent(component.getBlueprint()),
    ) as IListItem

    console.info('ADD_DATA_OBJECT', { listItem, ...result })

    if (listItem) {
      listItem.setDataObject?.(result.dataObject)
      listItem.set('listIndex', result.index)
      resolveComponent(listItem)

      // TODO - Decide to keep component implementation
      // component.#items[listItem.id] = { dataObject: result.dataObject, listItem }
      const logArgs = { ...result, listItem }
      log.green(`Created a new listItem`, logArgs)

      _resolveChildren(listItem, {
        onResolve: (c) => {
          c.set('listIndex', result.index)
          if (c.get('iteratorVar') === commonProps.iteratorVar) {
            c.set('dataObject', result.dataObject)
          }
          _internalResolver.resolve(c, {
            ...options,
            resolveComponent,
          })
          c.broadcast((cc) => cc.assign(commonProps))
        },
        props: commonProps,
        resolveComponent,
      })

      listItem.broadcast((child) => {
        child.on(event.component.listItem.REDRAWED, () => {
          console.info(
            `You have reached the "${event.component.listItem.REDRAWED}" event handler`,
          )
        })
      })

      listItem.on(event.component.listItem.REDRAW, (args) => {
        listItem.redraw(args, ({ child, dataKey, dataValue }) => {
          // TODO - resolveComponent ? or continue with below
          resolveComponent(child)
          if (child.noodlType === 'image') {
            //
          }
        })
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
      console.info(`Redrawing listItem`, { props, listItem })
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
    // console.info('FOUND LIST ITEM TO DELETE (START)')
    // console.info(listItem?.id)
    // console.info(listItem?.id)
    // console.info(listItem?.id)
    // console.info(listItem?.id)
    // console.info('FOUND LIST ITEM TO DELETE (END)')
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
    const { index, dataObject } = result
    const listItem: IListItem<'list'> | undefined = component.children()?.[
      index
    ]
    listItem.setDataObject(dataObject)
    log.green(`Updated dataObject`, { result, ...options })
    const args = { ...result, listItem }
    component.emit(event.component.list.UPDATE_LIST_ITEM, args)
    listItem.emit(event.component.listItem.REDRAW, {
      type: 'data-object',
      value: dataObject,
    })
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

    const blueprintInstance = createComponent(rawBlueprint)
    blueprintInstance.setParent(component)

    const resolvedBlueprint = resolveComponent(
      blueprintInstance,
    ) as IComponentTypeInstance

    resolvedBlueprint.set('listId', component.listId)
    resolvedBlueprint.set('iteratorVar', component.iteratorVar)

    // _.forEach(resolvedBlueprint.children(), (c) => {
    //   _internalResolver.resolve(c, {
    //     ...options,
    //     resolveComponent,
    //   })
    //   c.broadcast((cc) => cc.assign(commonProps))
    // })

    _resolveChildren(resolvedBlueprint, {
      onResolve: (c) => {
        _internalResolver.resolve(c, {
          ...options,
          resolveComponent,
        })
        c.broadcast((cc) => cc.assign(commonProps))
      },
      props: commonProps,
      resolveComponent,
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

  // Initiate the blueprint
  component.setBlueprint(resolveBlueprint(component))
  // // Initiate the listItem children
  // const listObject = component.getData()
  // if (listObject.length) {
  //   console.info(listObject)
  //   // Resetting the list data that was set from the parent prototype so we
  //   // can re-add them back in so the consumer can get the emitted events
  //   // console.info(component.removeDataObject(0))
  //   // console.info(component.removeDataObject(0))
  //   component.set('listObject', [])
  //   const numItems = listObject.length
  //   for (let index = 0; index < numItems; index++) {
  //     const dataObject = listObject[index]
  //     component.addDataObject(dataObject)
  //     log.green('Saved dataObject', dataObject)
  //   }
  // }
}

export default handleListInternalResolver
