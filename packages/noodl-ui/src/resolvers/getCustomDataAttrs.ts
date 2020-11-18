import _ from 'lodash'
import { findDataObject, findParent } from 'noodl-utils'
import Logger from 'logsnap'
import isReference from '../utils/isReference'
import { ResolverFn, IListItem, IList } from '../types'

const log = Logger.create('getCustomDataAttrs')

/**
 * Attaches any custom data- attributes not handled in other resolvers
 *    (ex: "data-ux" for UX interactions between the library and the web app)
 */
const getCustomDataAttrs: ResolverFn = (component, options) => {
  const { context, getPageObject, showDataKey, parser } = options
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

  /** Data values specific */
  if (dataKey) {
    let fieldParts = dataKey.split('.')
    let field = fieldParts.shift() || ''
    let fieldValue = pageObject?.[field]

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
      'data-key': dataKey,
      'data-name': field,
      'data-value': fieldValue,
    })
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
  if (_.isString(dataKey)) {
    let dataObject
    let dataValue
    let path
    let textFunc

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
      const listItem = findParent(component, (parent) => {
        return parent?.noodlType === 'listItem'
      }) as IListItem

      // if (listItem) log.gold('FOUND PARENT LISTITEM', listItem)
      textFunc = component.get('text=func')
      // Strip off the iteratorVar to keep the path that starts from the data objefct
      path = dataKey.split('.').slice(1)
      dataObject = listItem?.getDataObject?.()
      if (!dataObject) {
        dataObject = findDataObject({
          dataKey,
          pageObject,
          root: context.roots,
        })
        log.red(
          `The listItem parent did not have a dataObject available. ` +
            `Performed a higher level query:`,
          {
            component,
            context,
            dataObject,
            pageObject,
            listId,
            listIndex,
            iteratorVar,
            path,
            text,
            dataKey,
          },
        )
      }
      // Last things we can do is attempt to grab a data value through the
      // root or local root page object
      // Date components
      if (textFunc) {
        if (!dataObject) {
          log.red(
            `Expected a dataObject for a date component but received a type ` +
              `${typeof dataObject} instead.`,
            {
              component: component.toJS(),
              dataKey,
              dataObject,
              list: listItem?.parent?.(),
              listItem,
              listIndex,
              iteratorVar,
              path,
              textFunc,
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
                  textFunc,
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
                dataKey,
                dataObject,
                list: listItem?.parent?.(),
                listId,
                listIndex,
                iteratorVar,
                path,
                textFunc,
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
            `Expected a dataObject for a list descendant component but received a type ` +
              `${typeof dataObject} instead`,
            {
              component: component.toJS(),
              dataKey,
              dataObject,
              list: listItem.parent?.(),
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
            pageObject,
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
      } else if (_.has(pageObject, dataKey)) {
        dataValue = _.get(pageObject, dataKey, '')
      } else {
        log.red(
          `Unable to retrieve a data value for a ${component.noodlType} component. None of these conditions matched:\n` +
            `   1. Root/local root referenced dataKey\n` +
            `   2. List dataObjects\n` +
            `   3. Text=func date components\n`,
          {
            component: component.toJS(),
            context,
            dataKey,
            dataObject,
            dataValue,
            listIndex,
            iteratorVar,
            text,
            pageName: context.page,
            pageObject,
          },
        )
      }
    }

    if (dataValue) component.set('data-value', dataValue)
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
