import _ from 'lodash'
import produce, { isDraft, original } from 'immer'
import Logger from 'logsnap'
import { getRandomKey } from '../../utils/common'
import {
  ConsumerOptions,
  IComponentTypeInstance,
  IComponentTypeObject,
  IList,
  IListBlueprint,
  IListItem,
  IResolver,
} from '../../types'
import { event, emitTriggers } from '../../constants'
import createComponent from '../../utils/createComponent'
import { _resolveChildren } from './helpers'

const log = Logger.create('internal[handleList]')

const handleListInternalResolver = (
  component: IList,
  options: ConsumerOptions,
  _internalResolver: IResolver,
) => {
  const { createActionChainHandler, resolveComponent } = options
  const rawBlueprint = { ...component?.original?.children?.[0] }

  const commonProps = {
    listId: component.listId,
    iteratorVar: component.iteratorVar,
  }

  // Creates list items as new data objects are added
  component.on(event.component.list.ADD_DATA_OBJECT, (result, options) => {
    log.func(`on[${event.component.list.ADD_DATA_OBJECT}]`)

    const listItem = component.createChild(
      createComponent(component?.getBlueprint()),
    ) as IListItem

    listItem['id'] = getRandomKey()
    listItem.setDataObject?.(result.dataObject)
    listItem.set('listIndex', result.index)

    resolveComponent(listItem)

    // TODO - Decide to keep component implementation
    const logArgs = { options, ...result, list: component, listItem }

    log.grey(`Created a new listItem`, logArgs)

    listItem.broadcastRaw((componentParent, noodlChild, index) => {
      // console.info('broadcastRaw')
      // console.info(ff)
      // console.info('broadcastRaw')
      const child = componentParent.child(index)

      if (child) {
        emitTriggers.forEach((trigger) => {
          if (child?.original?.[trigger]) {
            child.action[trigger] = noodlChild[trigger]
            console.info('SET ORIGINAL ' + trigger, {
              component: child,
              noodlChild,
              trigger: child.action.trigger,
              actions: noodlChild[trigger],
            })
            child.set(
              trigger,
              createActionChainHandler(noodlChild[trigger], {
                component: child,
                trigger,
              }),
            )
          }
        })
      }
    })

    _resolveChildren(listItem, {
      onResolve: (c) => {
        if (c.get('iteratorVar') === commonProps.iteratorVar) {
          c.set('dataObject', result.dataObject)
          c.set('listIndex', result.index)
        }

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

    // listItem.broadcast((child) => {
    //   child.on(event.component.listItem.REDRAWED, () => {
    //     console.info(
    //       `You have reached the "${event.component.listItem.REDRAWED}" event handler`,
    //     )
    //   })
    // })

    // listItem.on(event.component.listItem.REDRAW, (args) => {
    //   listItem.redraw(args, ({ child, dataKey, dataValue }) => {
    //     // TODO - resolveComponent ? or continue with below
    //     resolveComponent(child)
    //     if (child.noodlType === 'image') {
    //       //
    //     }
    //   })
    // })

    // listItem.on(event.component.listItem.REDRAW, ({ props }) => {
    //   log.func('redraw')
    //   console.info(`Redrawing listItem`, { props, listItem })
    //   if (props) {
    //     forEachDeepChildren(listItem, (child) => {
    //       forEachEntries(props, (k, v) => child.set(k, v))
    //     })
    //   }
    //   // resolveComponent(listItem)
    //   // console.info('REDRAWED', listItem)
    //   listItem.emit(event.component.listItem.REDRAWED, { props, listItem })
    // })

    // listItem.emit('redraw')
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

    // console.info('blueprintInstance', {
    //   blueprint: resolvedBlueprint,
    //   children: resolvedBlueprint.children(),
    // })

    _.forEach(emitTriggers, (trigger) => {
      _.forEach(resolvedBlueprint.children(), (child) => {
        const handler = child.get(trigger)
        if (handler) {
          const originalActions = child?.original?.[trigger]

          child.set(
            trigger,
            createActionChainHandler(originalActions, {
              component: child,
              trigger,
            }),
          )
          // console.log('original child trigger object ' + trigger, {
          //   child,
          //   trigger,
          //   originalActions,
          //   loadedActions: child.get(trigger),
          // })
        }
      })
    })

    resolvedBlueprint.set('listId', component.listId)
    resolvedBlueprint.set('iteratorVar', component.iteratorVar)

    resolvedBlueprint.broadcastRaw((componentParent, noodlChild, index) => {
      // console.info('broadcastRaw')
      // console.info(ff)
      // console.info('broadcastRaw')
      const child = componentParent.child(index)

      if (child?.action) {
        emitTriggers.forEach((trigger) => {
          if (child?.action?.[trigger]) {
            child.action.trigger = noodlChild[trigger]
          }
        })
      }
    })

    _resolveChildren(resolvedBlueprint, {
      onResolve: (c) => {
        _internalResolver.resolve(c, {
          ...options,
          component: c,
          resolveComponent,
        })
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
}

export default handleListInternalResolver
