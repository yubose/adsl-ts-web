import _ from 'lodash'
import produce from 'immer'
import Logger from 'logsnap'
import { getRandomKey } from '../../utils/common'
import {
  ConsumerOptions,
  IComponentTypeObject,
  IList,
  IListBlueprint,
  IListItem,
  IResolver,
  NOODLComponent,
} from '../../types'
import { event } from '../../constants'
import { _resolveChildren } from './helpers'
import createComponent from '../../utils/createComponent'

const log = Logger.create('handleList')

const handleListInternalResolver = (
  component: IList,
  options: ConsumerOptions,
  _internalResolver: IResolver,
) => {
  const { getBaseStyles, resolveComponent, resolveComponentDeep } = options

  const rawBlueprint = (Array.isArray(component?.original?.children)
    ? { ...component.original.children[0] }
    : {
        ...(typeof component?.original?.children === 'string'
          ? { type: component.original.children }
          : { ...(component?.original?.children as IComponentTypeObject) }),
      }) as IComponentTypeObject

  const commonProps = {
    listId: component.listId,
    iteratorVar: component.iteratorVar,
  }

  const resolveBlueprint = (noodlListItem: NOODLComponent) => {
    const deepChildren = (noodlComponent: any) => {
      const props = {
        style: {
          ...getBaseStyles(),
          ...noodlComponent.style,
        },
        ...noodlComponent,
        ...commonProps,
      }
      if (props.children) {
        if (Array.isArray(props.children)) {
          props.children = props.children.map((c) => deepChildren(c))
        } else {
          props.children = deepChildren(props.children)
        }
      }
      return props
    }
    return deepChildren(noodlListItem) as NOODLComponent
  }

  // Creates list items as new data objects are added
  component.on(event.component.list.ADD_DATA_OBJECT, (result, options) => {
    log.func(`on[${event.component.list.ADD_DATA_OBJECT}]`)

    let listItem = createComponent(component?.getBlueprint()) as IListItem
    listItem.id = getRandomKey()
    listItem.setParent(component)
    listItem.setDataObject?.(result.dataObject)
    listItem.set('listIndex', result.index)
    listItem = resolveComponent(component.createChild(listItem)) as IListItem

    const logArgs = { options, ...result, list: component, listItem }

    // log.grey(`Created a new listItem`, listItem)

    _resolveChildren(listItem, {
      onResolve: (c) => {
        c.set('dataObject', result.dataObject)
        c.set('listIndex', result.index)
        c.assign(commonProps)
        _internalResolver.resolve(c, {
          ...options,
          component: c,
          resolveComponent,
        })
      },
      props: { ...commonProps, listIndex: result.index },
      resolveComponent,
    })

    component.emit(event.component.list.CREATE_LIST_ITEM, logArgs)
  })

  // Removes list items when their data object is removed
  component.on(event.component.list.DELETE_DATA_OBJECT, (result, options) => {
    log.func(`on[${event.component.list.DELETE_DATA_OBJECT}]`)
    const listItem = component.find(
      (child) => child?.getDataObject?.() === result.dataObject,
    )
    const dataObjectBefore = listItem?.getDataObject?.()
    listItem?.setDataObject(null)
    if (listItem) component.removeChild(listItem)
    log.grey(`Deleted a listItem`, {
      ...result,
      ...options,
      listItem,
      dataObjectBefore,
      dataObjectAfter: listItem?.getDataObject?.(),
    })
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

  // Initiate the blueprint
  component.setBlueprint(
    resolveBlueprint(rawBlueprint as NOODLComponent) as IListBlueprint,
  )
}

export default handleListInternalResolver
