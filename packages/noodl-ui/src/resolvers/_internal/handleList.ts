import Logger from 'logsnap'
import { ComponentObject } from 'noodl-types'
import List from '../../components/List'
import ListItem from '../../components/ListItem'
import { getRandomKey } from '../../utils/common'
import { ConsumerOptions, ListBlueprint, NOODLComponent } from '../../types'
import { InternalResolver } from '../../Resolver'
import { publish } from '../../utils/noodl'
import { event } from '../../constants'
import { _resolveChildren } from './helpers'
import createComponent from '../../utils/createComponent'

const log = Logger.create('handleList')
const stable = process.env.ECOS_ENV === 'stable'

const handleListInternalResolver = (
  component: List,
  options: ConsumerOptions,
  _internalResolver: InternalResolver,
) => {
  const {
    getBaseStyles,
    resolveComponent,
    resolveComponentDeep,
    componentCache,
  } = options

  const rawBlueprint = (Array.isArray(component?.original?.children)
    ? { ...component.original.children[0] }
    : {
        ...(typeof component?.original?.children === 'string'
          ? { type: component.original.children }
          : { ...(component?.original?.children as any) }),
      }) as ComponentObject

  const commonProps = {
    listId: component.listId,
    iteratorVar: component.iteratorVar,
  }

  const resolveBlueprint = (noodlListItem: NOODLComponent) => {
    const deepChildren = (noodlComponent: any) => {
      if (stable && noodlComponent !== noodlListItem) {
        log.func('resolveBlueprint [deepChildren]')
        log.cyan(`Generating a child descendant for the blueprint`, {
          rawListItemObject: noodlListItem,
          rawChildDescendantObject: noodlComponent,
        })
      }

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
          props.children = props.children.map(deepChildren)
        } else {
          props.children = deepChildren(props.children)
        }
      }
      return props
    }
    return deepChildren(noodlListItem) as NOODLComponent
  }

  // Creates list items as new data objects are added
  component.on(event.component.list.ADD_DATA_OBJECT, (result, args) => {
    log.func(`on[${event.component.list.ADD_DATA_OBJECT}]`)

    let listItem = createComponent(component?.getBlueprint() as any) as ListItem
    if (listItem) {
      listItem.setParent(component as any)
      listItem.setDataObject?.(result.dataObject)
      listItem.set('listIndex', result.index)
      listItem = resolveComponent(component.createChild(listItem)) as any
      componentCache().set(listItem)
    }

    _resolveChildren(listItem, {
      onResolve: (c: any) => {
        c.set('dataObject', result.dataObject)
        c.set('listIndex', result.index)
        c.assign(commonProps)
        if (stable) {
          log.func('_resolveChildren [onResolve]')
          log.cyan('Resolved child node for listItem', c)
        }
        // _internalResolver.resolve(c, {
        //   ...args,
        //   ...options,
        //   component: c,
        //   resolveComponent,
        // })
      },
      props: { ...commonProps, listIndex: result.index as number },
      resolveComponent,
    })

    component.emit(
      event.component.list.CREATE_LIST_ITEM,
      { ...result, listItem },
      {
        blueprint: component.getBlueprint(),
        iteratorVar: component.iteratorVar,
        listId: component.listId,
      },
    )
  })

  // Removes list items when their data object is removed
  component.on(event.component.list.DELETE_DATA_OBJECT, (result, args) => {
    log.func(`on[${event.component.list.DELETE_DATA_OBJECT}]`)
    const listItem = component?.find(
      (child) => child?.getDataObject?.() === result.dataObject,
    )
    const dataObjectBefore = listItem?.getDataObject?.()
    listItem?.setDataObject(null)
    stable &&
      log.cyan(`Removed dataObject`, {
        dataObjectBefore,
        dataObjectAfter: listItem?.getDataObject(),
      })
    if (listItem) {
      component.removeChild()
      componentCache().remove(listItem)
      publish(listItem, (c) => {
        log.func(event.component.list.DELETE_DATA_OBJECT)
        log.green(`Removing from cache: ${c.id}`)
        componentCache().remove(c)
      })
    }
    log.grey(`Deleted a listItem`, {
      ...result,
      ...args,
      listItem,
      dataObjectBefore,
      dataObjectAfter: listItem?.getDataObject?.(),
    })
    component.emit(
      event.component.list.REMOVE_LIST_ITEM,
      { ...result, listItem } as any,
      {} as any,
    )
  })

  // Updates list items with new updates to their data object
  component.on(event.component.list.UPDATE_DATA_OBJECT, (result, options) => {
    log.func(`on[${event.component.list.UPDATE_DATA_OBJECT}]`)
    const { index, dataObject } = result
    const listItem: ListItem | undefined = component.children?.[index as number]
    listItem?.setDataObject(dataObject)
    stable && log.cyan(`Attached dataObject to listItem`, dataObject)
    component.emit(
      event.component.list.UPDATE_LIST_ITEM,
      { ...result, listItem: listItem as ListItem },
      options,
    )
  })

  const blueprint = resolveBlueprint(
    rawBlueprint as NOODLComponent,
  ) as ListBlueprint

  stable &&
    log.cyan(`Setting the blueprint for creating listItem components`, {
      list: component,
      blueprint,
    })

  // Initiate the blueprint
  component.setBlueprint(blueprint)
}

export default handleListInternalResolver
