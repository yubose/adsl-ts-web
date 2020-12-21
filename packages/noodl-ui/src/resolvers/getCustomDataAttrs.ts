import {
  createEmitDataKey,
  excludeIteratorVar,
  findDataValue,
  isEmitObj,
} from 'noodl-utils'
import EmitAction from '../Action/EmitAction'
import { isPromise } from '../utils/common'
import { findListDataObject } from '../utils/noodl'
import { ResolverFn } from '../types'

/**
 * Attaches any custom data- attributes not handled in other resolvers
 *    (ex: "data-ux" for UX interactions between the library and the web app)
 */
const getCustomDataAttrs: ResolverFn = (component, options) => {
  const { context, getCbs, getPageObject, getRoot } = options
  const { page } = context
  const { noodlType } = component
  const { contentType = '', dataKey, viewTag } = component.get([
    'contentType',
    'dataKey',
    'viewTag',
  ])

  /* -------------------------------------------------------
     ---- UI VISIBILITY RELATED
   -------------------------------------------------------- */
  if (contentType === 'passwordHidden' || contentType === 'messageHidden') {
    component.set('data-ux', contentType)
  } else if (/(vidoeSubStream|videoSubStream)/i.test(contentType)) {
    component.set('data-ux', contentType)
  }

  /* -------------------------------------------------------
      ---- POPUPS
    -------------------------------------------------------- */
  if (noodlType === 'popUp') {
    component.set('data-ux', viewTag)
  }

  /* -------------------------------------------------------
      ---- LISTS
    -------------------------------------------------------- */
  if (noodlType === 'list') {
    component.set('data-listid', component.id)
  }

  /* -------------------------------------------------------
      ---- REFERENCES / DATAKEY 
    -------------------------------------------------------- */

  if (typeof dataKey === 'string') {
    let iteratorVar = component.get('iteratorVar') || ''
    let dataObject: any = findListDataObject(component)
    let dataPath = excludeIteratorVar(dataKey, iteratorVar) || ''
    let dataValue = component.get('dataValue')
    let fieldParts = dataKey?.split?.('.')
    let field = fieldParts?.shift?.() || ''
    let fieldValue = getPageObject(page)?.[field]
    let resolvedValue: any
    let textFunc = component.get('text=func')

    // component.set(
    //   'data-name',
    //   dataKey.split('.')[dataKey.length ? dataKey.length - 1 : 0],
    // )

    if (isEmitObj(dataValue)) {
      const emitAction = new EmitAction(dataValue, {
        callback: async (action, options) => {
          const callbacks = (getCbs('action').emit || []).reduce(
            (acc, obj) =>
              obj?.trigger === 'dataValue' ? acc.concat(obj) : acc,
            [] as any[],
          )
          if (!callbacks.length) return ''
          const result = (await Promise.race(
            callbacks.map((obj) =>
              obj?.fn?.(emitAction, options, context.actionsContext),
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

    component.assign({
      'data-key': dataKey,
      'data-name': field,
      'data-value': resolvedValue || '',
    })
  }

  /* -------------------------------------------------------
      ---- OTHER
    -------------------------------------------------------- */
  // Hardcoding / custom injecting these for now
  if (viewTag) {
    if (viewTag === 'mainStream') {
      component.set('data-ux', 'mainStream')
    } else if (viewTag === 'camera') {
      component.set('data-ux', 'camera')
    } else if (viewTag === 'microphone') {
      component.set('data-ux', 'microphone')
    } else if (viewTag === 'hangUp') {
      component.set('data-ux', 'hangUp')
    } else if (viewTag === 'inviteOthers') {
      component.set('data-ux', 'inviteOthers')
    } else if (viewTag === 'subStream') {
      component.set('data-ux', 'subStream')
    } else if (viewTag === 'selfStream') {
      component.set('data-ux', 'selfStream')
    } else {
      // TODO convert others to use data-view-tag
      component.set('data-viewtag', viewTag)
      if (!component.get('data-ux')) component.set('data-ux', viewTag)
    }
  }
}

export default getCustomDataAttrs
