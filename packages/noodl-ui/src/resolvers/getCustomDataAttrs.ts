import _ from 'lodash'
import { findParent } from 'noodl-utils'
import Logger from 'logsnap'
import isReference from '../utils/isReference'
import { ResolverFn, IComponentTypeInstance, IListItem } from '../types'

const log = Logger.create('getCustomDataAttrs')

/**
 * Attaches any custom data- attributes not handled in other resolvers
 *    (ex: "data-ux" for UX interactions between the library and the web app)
 */
const getCustomDataAttrs: ResolverFn = (component, options) => {
  const { context, showDataKey, getNode, getNodes, parser } = options
  const { page } = context

  let parent: IComponentTypeInstance

  const { type, noodlType } = component

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
    const { listId = '', listIndex, iteratorVar = '' } = component.get([
      'listId',
      'listIndex',
      'iteratorVar',
    ])
    const isListDescendant = !!iteratorVar
    // Component is retrieving data from a list
    if (dataKey.startsWith(iteratorVar)) {
      if (isListDescendant) {
        let dataObject
        let dataValue
        const path = dataKey.split('.').slice(1)
        // If this is a descendant of a list component and it has an iteratorVar that is
        // being used as a prefix for data keys, then it's most likely expecting a data object
        // from the list data
        const listItem = findParent(
          component,
          (child) => child.noodlType === 'listItem',
        ) as IListItem
        if (listItem) {
          dataObject = listItem.getDataObject()
          if (_.isObjectLike(dataObject)) {
            dataValue = _.get(dataObject, path)
          } else if (_.isString(dataObject)) {
            log.red(
              `Expected an object-like value as a dataObject but received a string instead`,
              {
                component: component.toJS(),
                context,
                dataKey,
                listItem,
              },
            )
          } else {
            log.red(
              `Found a listItem for a component expecting data with dataKey "${dataKey}" but none was found`,
              {
                component: component.toJS(),
                context,
                dataKey,
                iteratorVar,
              },
            )
          }
        } else {
          log.red(
            `Tried to query for a listItem parent for dataKey "${dataKey}" ` +
              `but none could be found`,
            {
              component: component.toJS(),
              context,
              dataKey,
              iteratorVar,
            },
          )
        }
      }
      if (isReference(dataKey)) {
        component.set(
          'data-value',
          showDataKey
            ? dataKey
            : component.get('text') || component.get('placeholder'),
        )
      } else {
        // Date components
        if (component.get('text=func')) {
          const iteratorVar = component.get('iteratorVar') || ''
          // These date components receive their values from a list
          if (iteratorVar && dataKey.startsWith(iteratorVar)) {
            let path
            const { listId, listIndex } = component.get(['listId', 'listIndex'])
            const listItem = findParent(
              component,
              (child) => child.noodlType === 'listItem',
            ) as IListItem
            const dataObject = listItem?.getDataObject?.()

            if (!dataObject) {
              log.red(
                'Expected a dataObject for a date component but received an invalid value instead',
                {
                  component: component.snapshot(),
                  dataObject,
                  listItem,
                  listIndex,
                },
              )
              // Default to showing the dataKey even when its a raw reference
              component.set(
                'data-value',
                showDataKey
                  ? dataKey
                  : component.get('text') || component.get('placeholder'),
              )
            } else {
              const textFunc = component.get('text=func')
              if (_.isFunction(textFunc)) {
                path = dataKey.split('.').slice(1)
                const ecosDate = _.get(dataObject, path)
                if (ecosDate == undefined) {
                  log.red(
                    `Tried to retrieve the date value from a dataObject with iteratorVar "${iteratorVar}" using ` +
                      `the path "${dataKey}" but received null or undefined instead`,
                    {
                      component: component.snapshot(),
                      listItem,
                      listIndex,
                      iteratorVar,
                      path,
                    },
                  )
                }
                if (ecosDate === dataKey) {
                  // Allow the raw dataKey (unparsed) to show in pages if
                  // showDataKey is true
                  component.set(
                    'data-value',
                    showDataKey
                      ? dataKey
                      : component.get('text') || component.get('placeholder'),
                  )
                } else {
                  component.set('data-value', textFunc(ecosDate))
                }
              } else {
                log.red(
                  `Expected text=func to be a function but it was of type "${typeof textFunc}"`,
                  {
                    component: component.snapshot(),
                    listId,
                    listIndex,
                    dataObject,
                    path,
                  },
                )
              }
            }
          }
        } else {
          log.red(`TODO/REMINDER: This code block was reached. Look into this`)
          // component.set('data-value', component.get('data-value'))
        }
      }
    } else {
      const data = parser.getByDataKey(dataKey, '')
      if (_.isString(data)) {
        if (isReference(data) || data.startsWith('itemObject')) {
          component.set(
            'data-value',
            showDataKey
              ? data
              : component.get('text') || component.get('placeholder'),
          )
        }
      }
      component.set('data-value', data)
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
    }
  }
}

export default getCustomDataAttrs
