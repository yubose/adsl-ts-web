import { ComponentObject } from 'noodl-types'
import {
  createEmitDataKey,
  excludeIteratorVar,
  findDataValue,
  isEmitObj,
} from 'noodl-utils'
import EmitAction from '../../Action/EmitAction'
import { isPromise } from '../../utils/common'
import { findListDataObject } from '../../utils/noodl'
import runner from '../runner'

const uXContentTypes = ['passwordHidden', 'messageHidden'] as const

export default {
  name: 'getDataAttrs',
  resolve({
    component,
    getActionsContext,
    getPageObject,
    getActions,
    getCurrentPage,
    getRoot,
  }: any) {
    if (!component) return

    const { type, contentType, dataKey, viewTag, id } = component

    // Popups
    if (uXContentTypes.includes(contentType)) {
      component['data-ux'] = contentType
    }
    // Lists
    if (type === 'list') {
      component['data-listid'] = id
    }
    // Hardcoding / custom injecting these for now
    if (viewTag) {
      if (viewTag === 'mainStream') {
        component['data-ux'] = 'mainStream'
      } else if (viewTag === 'camera') {
        component['data-ux'] = 'camera'
      } else if (viewTag === 'microphone') {
        component['data-ux'] = 'microphone'
      } else if (viewTag === 'hangUp') {
        component['data-ux'] = 'hangUp'
      } else if (viewTag === 'inviteOthers') {
        component['data-ux'] = 'inviteOthers'
      } else if (viewTag === 'subStream') {
        component['data-ux'] = 'subStream'
      } else if (viewTag === 'selfStream') {
        component['data-ux'] = 'selfStream'
      } else {
        // TODO convert others to use data-view-tag
        component['data-viewtag'] = viewTag
        if (!component['data-ux']) component['data-ux'] = viewTag
      }
    }

    // Data values
    if (typeof dataKey === 'string') {
      let { dataValue, iteratorVar = '' } = component
      let textFunc = component['text=func']
      let dataObject: any = findListDataObject(component)
      let dataPath = excludeIteratorVar(dataKey, iteratorVar) || ''
      let fieldParts = dataKey?.split?.('.')
      let field = fieldParts?.shift?.() || ''
      let fieldValue = getPageObject(getCurrentPage())?.[field]
      let resolvedValue: any

      // component.set(
      //   'data-name',
      //   dataKey.split('.')[dataKey.length ? dataKey.length - 1 : 0],
      // )

      if (isEmitObj(dataValue)) {
        const emitAction = new EmitAction(dataValue as any, {
          callback: async (action, options) => {
            const callbacks = (getActions()?.emit || []).reduce(
              (acc, obj) =>
                obj?.trigger === 'dataValue' ? acc.concat(obj) : acc,
              [] as any[],
            )
            if (!callbacks.length) return ''
            const result = (await Promise.race(
              callbacks.map((obj) =>
                obj?.fn?.(emitAction, options, getActionsContext()),
              ),
            )) as any
            return (Array.isArray(result) ? result[0] : result) || ''
          },
          dataKey: createEmitDataKey(
            dataValue.emit.dataKey,
            [dataObject, () => getPageObject(context.page), () => getRoot()],
            { iteratorVar },
          ),
          iteratorVar,
          trigger: 'dataValue',
        })
        const result = emitAction.execute(options)
        if (isPromise(result)) {
          result
            .then((res) => {
              resolvedValue = res
              component.set('data-value', res)
            })
            .catch((err) => {
              console.error(err)
              throw new Error(err.message)
            })
        } else {
          resolvedValue = result
          component.set('data-value', result)
        }
      } else {
        resolvedValue = findDataValue(
          [
            findListDataObject(component),
            () => getPageObject(page),
            () => getRoot(),
          ],
          dataPath,
        )
      }

      if (fieldParts?.length) {
        while (fieldParts.length) {
          field = (fieldParts?.shift?.() as string) || ''
          field = field[0]?.toLowerCase?.() + field.substring(1)
          fieldValue = fieldValue?.[field]
        }
      } else {
        field = fieldParts?.[0] || ''
      }

      if (typeof textFunc === 'function') {
        resolvedValue = textFunc(resolvedValue)
      }

      Object.assign(component, {
        'data-key': dataKey,
        'data-name': field,
        'data-value': resolvedValue || '',
      })
    }
  },
}
