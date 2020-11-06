import _ from 'lodash'
import { findParent } from 'noodl-utils'
import Logger from 'logsnap'
import isReference from '../utils/isReference'
import { ResolverFn, IListItem } from '../types'

const log = Logger.create('getCustomDataAttrs')

/**
 * Attaches any custom data- attributes not handled in other resolvers
 *    (ex: "data-ux" for UX interactions between the library and the web app)
 */
const getCustomDataAttrs: ResolverFn = (component, options) => {
  const { context, showDataKey, parser } = options
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

  /** formData specific */
  if (dataKey) {
    let fieldParts = dataKey.split('.')
    let field = fieldParts.shift() || ''
    let fieldValue = page?.[field]

    if (fieldParts.length) {
      while (fieldParts.length) {
        field = (fieldParts.shift() as string) || ''
        field = field[0]?.toLowerCase?.() + field.substring(1)
        fieldValue = fieldValue?.[field]
      }
    } else {
      field = fieldParts[0] || ''
    }
    component.assign({
      'data-name': field,
      'data-key': dataKey,
      'data-value': fieldValue,
    })
  }

  /* -------------------------------------------------------
      ---- LISTS
    -------------------------------------------------------- */
  if (noodlType === 'list') {
    const listObject = component.get('listObject')
    if (listObject !== undefined) {
      let listObjects: typeof listObject
      // Hard code some of this stuff for the videoSubStream list component for
      // now until we figure out a better solution
      if (/(vidoeSubStream|videoSubStream)/i.test(contentType || '')) {
        listObjects = (page?.listData?.participants || []) as any[]
      } else {
        listObjects = _.isArray(listObject) ? listObject : [listObject]
      }
      component.set('data-listid', component.id)
    } else {
      log.red(
        'A list component is missing the "listObject" property',
        component.snapshot(),
      )
    }
  }

  /* -------------------------------------------------------
      ---- REFERENCES / DATAKEY 
    -------------------------------------------------------- */
  if (_.isString(dataKey)) {
    let dataObject, dataValue

    const {
      listId = '',
      listIndex,
      iteratorVar = '',
      placeholder = '',
      text = '',
    } = component.get([
      'listId',
      'listIndex',
      'iteratorVar',
      'placeholder',
      'text',
    ])

    // Handle list related components that expect data objects
    if (iteratorVar && dataKey.startsWith(iteratorVar)) {
      const fn = (parent: any) => {
        return parent?.type === 'listItem'
      }
      const listItem = findParent(component, (parent) => {
        console.log('parent', component.parent())
        return fn(parent)
      }) as IListItem
      const textFunc = component.get('text=func')
      // Strip off the iteratorVar to keep the path that starts from the data objefct
      const path = dataKey.split('.').slice(1)
      dataObject = listItem?.getDataObject?.()
      // Last things we can do is attempt to grab a data value through the
      // root or local root page object
      // Date components
      if (textFunc) {
        if (!dataObject) {
          log.red(
            `Expected a dataObject for a date component but received a type ` +
              `${typeof dataObject} instead`,
            {
              component: component.toJS(),
              dataKey,
              dataObject,
              listItem,
              listIndex,
              iteratorVar,
            },
          )
          // Default to showing the dataKey even when its a raw reference
          dataValue = showDataKey ? dataKey : text || placeholder || ''
        } else {
          if (_.isFunction(textFunc)) {
            dataValue = _.get(dataObject, path)
            if (dataValue == undefined) {
              log.red(
                `Tried to retrieve the date value from a dataObject with  ` +
                  `iteratorVar "${iteratorVar}" using the path "${dataKey}" ` +
                  `but received null or undefined instead`,
                {
                  component: component.toJS(),
                  dataKey,
                  dataObject,
                  listItem,
                  listIndex,
                  iteratorVar,
                  path,
                  'text=func': textFunc,
                },
              )
            } else if (dataValue === dataKey) {
              // Allow the raw dataKey (unparsed) to show in pages if
              // showDataKey is true
              dataValue = showDataKey ? dataKey : text || placeholder || ''
            } else {
              dataValue = textFunc(dataValue)
            }
          } else {
            log.red(
              `Expected text=func to be a function but it was of type "${typeof textFunc}"`,
              {
                component: component.toJS(),
                listId,
                listIndex,
                dataKey,
                dataObject,
                path,
                'text=func': textFunc,
              },
            )
          }
        }
      }
      // The only other case in this situation is resolving a list related component
      // since they operate on lists of data objects
      else if (listItem) {
        if (dataObject) {
          dataValue = _.get(dataObject, path)
        } else {
          log.red(
            `Expected a dataObject for a list related component but received a type ` +
              `${typeof dataObject} instead`,
            {
              component: component.toJS(),
              dataKey,
              dataObject,
              listItem,
              listIndex,
              iteratorVar,
              path,
            },
          )
          // Default to showing the dataKey even when its a raw reference
          dataValue = showDataKey ? dataKey : text || placeholder || ''
        }
      } else {
        log.red(
          `Tried to query for a listItem in the parent prototype chain for a ` +
            `dataObject consumer with dataKey "${dataKey}" but nothing was found`,
          {
            component: component.toJS(),
            dataKey,
            listItem,
            iteratorVar,
            page: context.page,
            path,
          },
        )
      }
    }
    // Components that find their data values through a higher level like the root object
    else {
      if (isReference(dataKey)) {
        dataValue = parser.getByDataKey(
          dataKey,
          showDataKey ? dataKey : text || placeholder,
        )
      } else {
        log.red(
          `TODO/REMINDER: This code block was reached. None of these situations matched: ` +
            `1. Root/local root referenced dataKey ` +
            `2. List dataObjects. ` +
            `3. Text=func date components. Look into this`,
          {
            component: component.toJS(),
            dataKey,
            dataObject,
            dataValue,
            listIndex,
            iteratorVar,
            text,
          },
        )
        // component.set('data-value', component.get('data-value'))
      }
    }

    component.set('data-value', dataValue)
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
    }
  }
}

export default getCustomDataAttrs
