import {
  ActionChainActionCallbackOptions,
  getDataObjectValue,
  IAction,
  IListItem,
  NOODLEmitObject,
} from 'noodl-ui'
import { findParent } from 'noodl-utils'
import sinon from 'sinon'

export const emit = async (
  action: IAction<'builtIn', NOODLEmitObject>,
  options: ActionChainActionCallbackOptions,
) => {
  let { component, context } = options
  let { emit } = action.original
  let { actions, dataKey } = emit
  let originalDataKey = dataKey

  if (component.get('viewTag')) {
    // console.info('Found a viewTag component', {
    //   action,
    //   component: component.toJS(),
    //   actions,
    //   dataKey,
    // })
  }

  // If dataKey isn't available to use, directly pass the action to emitCall
  // since it is already handled there
  if (!dataKey) {
    //
  } else {
    const iteratorVar = component.get('iteratorVar') || ''
    let dataObject
    let dataPath = dataKey as string
    let dataValue

    if (typeof dataKey === 'string') {
      originalDataKey = dataKey
      if (dataKey.startsWith(iteratorVar)) {
        dataPath = dataPath.split('.').slice(1).join('.')
        const listItem = findParent(
          component,
          (parent) => parent?.noodlType === 'listItem',
        ) as IListItem | null

        if (listItem) {
          dataObject = listItem.getDataObject?.()
          dataValue = getDataObjectValue({
            dataObject,
            dataKey: dataPath,
            iteratorVar,
          })
        }

        actions[0](dataObject)
      } else {
        // Assuming the dataObject is somewhere in the root or local root level
        dataObject = {}
      }
    } else if (dataKey && typeof dataKey === 'object') {
      originalDataKey = dataKey
      dataKey = Object.entries(dataKey).reduce((acc: any, [key, dataPath]) => {
        let dataObject
        let dataValue

        console.info({
          key,
          resolvedDataKey: dataPath,
          iteratorVar,
          originalDataKey,
        })

        if (typeof dataPath === 'string') {
          if (originalDataKey[key] === iteratorVar) {
            actions[0].if[0]({ dataKey, actions, pageName: context.page })
            const listItem = findParent(
              component,
              (parent) => parent?.noodlType === 'listItem',
            ) as IListItem | null
            // console.info(findParent(component, (p) => p.noodlType === 'list'))
            console.info('------------------------------')
            console.info('listItem', listItem)
            console.info('dataObject', listItem.getDataObject())
            console.info('dataObject', listItem.getDataObject())
            console.info('dataObject', listItem.getDataObject())
            console.info('------------------------------')
            if (listItem) {
              dataObject = listItem.getDataObject?.()
              dataValue = getDataObjectValue({
                dataObject,
                dataKey: dataPath,
                iteratorVar,
              })
              acc[key] = dataObject
              console.info(listItem.getDataObject())
            }
          } else {
            // Assuming the dataObject is somewhere in the root or local root level
            dataObject = {}
            if (dataObject) {
              acc[key] = dataObject
            }
          }
        }

        return acc
      }, {} as typeof emit['dataKey'])
      // actions[0]({ dataKey, actions, pageName: context.page })
    }
  }
}
