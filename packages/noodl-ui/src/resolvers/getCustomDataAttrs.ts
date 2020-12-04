import _ from 'lodash'
import {
  createEmitDataKey,
  findListDataObject,
  findDataValue,
  isEmitObj,
  excludeIteratorVar,
} from 'noodl-utils'
import Logger from 'logsnap'
import isReference from '../utils/isReference'
import { ResolverFn } from '../types'
import EmitAction from '../Action/EmitAction'
import { isPromise } from '../utils/common'

const log = Logger.create('getCustomDataAttrs')

/**
 * Attaches any custom data- attributes not handled in other resolvers
 *    (ex: "data-ux" for UX interactions between the library and the web app)
 */
const getCustomDataAttrs: ResolverFn = (component, options) => {
  const {
    context,
    getCbs,
    getPageObject,
    getRoot,
    showDataKey,
    parser,
  } = options
  const { page } = context
  const { noodlType } = component
  const { contentType = '', dataKey, viewTag } = component.get([
    'contentType',
    'dataKey',
    'viewTag',
  ])
  const pageObject = getPageObject(page)

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
    let listObjects: any[]
    const listComponent = component as any
    const listObject = listComponent.getData()
    listComponent.set('data-listid', listComponent.id)

    if (listObject !== undefined) {
      // Hard code some of this stuff for the videoSubStream list component for
      // now until we figure out a better solution
      if (/(vidoeSubStream|videoSubStream)/i.test(contentType || '')) {
        listObjects = pageObject?.listData?.participants || []
      } else {
        listObjects = _.isArray(listObject) ? listObject : [listObject]
      }
    } else {
      log.red(
        'A list component is missing the "listObject" property',
        listComponent.snapshot(),
      )
    }
  }

  /* -------------------------------------------------------
      ---- REFERENCES / DATAKEY 
    -------------------------------------------------------- */

  if (dataKey) {
    let dataObject: any

    if (isEmitObj(dataKey)) {
      const emitAction = new EmitAction(dataKey, {
        iteratorVar: component.get('iteratorVar'),
        trigger: 'dataKey',
      })
      dataObject = findListDataObject(component)
      emitAction.setDataKey(
        createEmitDataKey(
          emitAction.original.emit.dataKey,
          [dataObject, () => pageObject, () => getRoot()],
          { iteratorVar: emitAction.iteratorVar },
        ),
      )
      let resolvedDataKey = ''
      emitAction.callback = async (snapshot) => {
        log.grey(`Executing dataKey emit action callback`, snapshot)
        const callbacks = _.reduce(
          getCbs().action.emit || [],
          (acc, obj) => (obj?.trigger === 'dataKey' ? acc.concat(obj) : acc),
          [],
        )
        if (!callbacks.length) return ''
        const result = await Promise.race(
          callbacks.map((obj) =>
            obj?.fn?.(emitAction, options, context.actionsContext),
          ),
        )
        return (Array.isArray(result) ? result[0] : result) || ''
      }

      // Result returned should be a string type
      let result = emitAction.execute(dataKey) as string | Promise<string>

      log.grey(`Result received from dataKey emit action`, {
        snapshot: emitAction.getSnapshot(),
        result,
      })

      if (isPromise(result)) {
        result
          .then((res) => {
            resolvedDataKey = res
            log.grey(`Resolved promise with: `, {
              resolvedPromiseResult: resolvedDataKey,
              action: emitAction,
            })
            component.set('data-key', resolvedDataKey)
            component.emit('dataKey', resolvedDataKey)
          })
          .catch((err) => Promise.reject(err))
      } else if (result) {
        resolvedDataKey = result
        component.set('data-key', resolvedDataKey)
        component.emit('dataKey', resolvedDataKey)
      }
    } else if (_.isString(dataKey)) {
      const iteratorVar = component.get('iteratorVar') || ''
      const path = excludeIteratorVar(dataKey, iteratorVar) || ''
      const dataValue = findDataValue(
        [
          findListDataObject(component),
          () => getPageObject(page),
          () => getRoot(),
        ],
        path,
      )
      log.gold('dataValue', dataValue)
      // let dataValue = dataObject
      let textFunc = component.get('text=func')
      let fieldParts = dataKey?.split?.('.')
      let field = fieldParts?.shift?.() || ''
      let fieldValue = pageObject?.[field]

      if (fieldParts?.length) {
        while (fieldParts.length) {
          field = (fieldParts?.shift?.() as string) || ''
          field = field[0]?.toLowerCase?.() + field.substring(1)
          fieldValue = fieldValue?.[field]
        }
      } else {
        field = fieldParts?.[0] || ''
      }

      component.assign({
        'data-key': dataKey,
        'data-name': field,
        'data-value': _.isFunction(textFunc)
          ? textFunc(dataValue) || ''
          : dataValue || '',
      })

      // Components that find their data values through a higher level like the root object
      //   else {
      if (isReference(dataKey)) {
        if (dataValue != undefined) component.set('data-value', dataValue)
        else {
          component.set(
            'data-value',
            dataValue != undefined
              ? dataValue
              : parser.getByDataKey(
                  dataKey,
                  showDataKey
                    ? dataKey
                    : component.get('text') || component.get('placeholder'),
                ),
          )
        }
      }
    }
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
    }
  }
}

export default getCustomDataAttrs
