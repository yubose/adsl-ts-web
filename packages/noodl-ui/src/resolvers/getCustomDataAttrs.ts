import _ from 'lodash'
import {
  createEmitDataKey,
  findDataObject,
  findParent,
  isEmitObj,
  isListConsumer,
} from 'noodl-utils'
import Logger from 'logsnap'
import isReference from '../utils/isReference'
import { ResolverFn, IListItem, IList } from '../types'
import EmitAction from '../Action/EmitAction'
import { getDataObjectValue } from '../utils/noodl'

const log = Logger.create('getCustomDataAttrs')

/**
 * Attaches any custom data- attributes not handled in other resolvers
 *    (ex: "data-ux" for UX interactions between the library and the web app)
 */
const getCustomDataAttrs: ResolverFn = (component, options) => {
  const { context, getPageObject, getRoot, showDataKey, parser } = options
  const { page, roots } = context
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
    const listComponent = component as IList
    const listObject = listComponent.getData()

    if (listObject !== undefined) {
      // Hard code some of this stuff for the videoSubStream list component for
      // now until we figure out a better solution
      if (/(vidoeSubStream|videoSubStream)/i.test(contentType || '')) {
        listObjects = pageObject?.listData?.participants || []
      } else {
        listObjects = _.isArray(listObject) ? listObject : [listObject]
      }
      listComponent.set('data-listid', listComponent.id)
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
    if (isEmitObj(dataKey)) {
      const emitAction = new EmitAction(dataKey, { trigger: 'dataKey' })
      const dataObject = findDataObject(component)
      if (isListConsumer(component)) {
        emitAction
          .set('dataKey', createEmitDataKey(dataKey, dataObject))
          .set('dataObject', dataObject)
          .set('iteratorVar', component.get('iteratorVar'))
      }
    } else if (_.isString(dataKey)) {
      let iteratorVar = component.get('iteratorVar')
      let dataObject = findDataObject({
        component,
        dataKey,
        pageObject,
        root: roots || getRoot(),
      })
      let dataValue = getDataObjectValue({ dataObject, dataKey, iteratorVar })
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
          : typeof dataValue !== 'undefined'
          ? dataValue
          : dataValue || '',
      })

      // Components that find their data values through a higher level like the root object
      //   else {
      if (isReference(dataKey)) {
        if (dataValue != undefined) component.set('data-value', dataValue)
        else {
          dataValue =
            dataValue != undefined
              ? dataValue
              : parser.getByDataKey(
                  dataKey,
                  showDataKey
                    ? dataKey
                    : component.get('text') || component.get('placeholder'),
                )
          component.set('data-value', dataValue)
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
