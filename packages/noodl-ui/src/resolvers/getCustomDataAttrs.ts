import _ from 'lodash'
import { identify } from '../utils/noodl'
import isReference from '../utils/isReference'
import { IComponent, Resolver } from '../types'
import Logger from 'logsnap'

const log = Logger.create('getCustomDataAttrs')

/**
 * Attaches any custom data- attributes not handled in other resolvers
 *    (ex: "data-ux" for UX interactions between the library and the web app)
 * @param { Component } component
 * @param { ResolverConsumerOptions } options
 * @return { void }
 */
const getCustomDataAttrs: Resolver = (component: IComponent, options) => {
  const {
    context,
    getFallbackDataValue,
    showDataKey,
    getDraftedNode,
    getDraftedNodes,
    getList,
    getListItem,
    parser,
  } = options
  const { page } = context

  let parent: any

  const { type, contentType = '', dataKey, parentId, viewTag } = component.get([
    'type',
    'contentType',
    'dataKey',
    'parentId',
    'viewTag',
  ])

  let itemObject

  if (_.isObjectLike(component)) {
    /* -------------------------------------------------------
     ---- UI VISIBILITY RELATED
   -------------------------------------------------------- */
    if (contentType === 'passwordHidden') {
      component.set('data-ux', contentType)
    }
    //
    else if (/(vidoeSubStream|videoSubStream)/i.test(contentType)) {
      component.set('data-ux', contentType)
    }

    // Date components
    if (identify.component.isDate(component.snapshot())) {
      if (dataKey) {
        // These date components receive their values from a list
        if (dataKey.startsWith('itemObject')) {
          let path
          const listId = component.get('listId')
          const listItemIndex = component.get('listItemIndex')
          itemObject = getListItem(listId, listItemIndex)

          if (!itemObject) {
            log.red(
              'Expected an itemObject for a date component but received an invalid value instead',
              {
                component: component.snapshot(),
                itemObject,
                listData: getList(listId || ''),
              },
            )
            // Default to showing the dataKey even when its a raw reference
            component.set(
              'data-value',
              showDataKey ? dataKey : getFallbackDataValue(component),
            )
          } else {
            const textFunc = component.get('text=func')
            if (_.isFunction(textFunc)) {
              path = dataKey.split('.').slice(1)
              const ecosDate = _.get(itemObject, path)
              if (ecosDate == undefined) {
                log.red(
                  `Tried to retrieve the date value from an itemObject using ` +
                    `the path "${dataKey}" but received null or undefined instead`,
                  {
                    component: component.snapshot(),
                    listData: getList(listId || ''),
                    listItem: getListItem(listId, listItemIndex),
                    listItemIndex,
                    path,
                  },
                )
              }
              if (ecosDate === dataKey) {
                // Allow the raw dataKey (unparsed) to show in pages if
                // showDataKey is true
                component.set(
                  'data-value',
                  showDataKey ? dataKey : getFallbackDataValue(component),
                )
              } else {
                component.set('data-value', ecosDate)
              }
            } else {
              log.red(
                `Expected text=func to be a function but it was a type "${typeof textFunc}"`,
                {
                  component: component.snapshot(),
                  listData: getList(listId || ''),
                  listItem: getListItem(listId, listItemIndex),
                  listItemIndex,
                  path,
                },
              )
            }
          }
        }
      } else {
        const listId = component.get('listId') || ''
        log.red(
          'Encountered a date component but it either did not have a dataKey ' +
            'or the dataKey is invalid',
          {
            component: component.snapshot(),
            listData: getList(listId),
            listItem: getListItem(listId, component.get('listItemIndex')),
          },
        )
      }
    }

    /* -------------------------------------------------------
      ---- POPUPS
    -------------------------------------------------------- */
    if (type === 'popUp') {
      component.set('data-ux', component.get('viewTag'))
    }

    /** formData specific */
    if (dataKey) {
      let fieldParts = dataKey.split('.')
      let field = fieldParts.shift() || ''
      let fieldValue = page.object?.[field]

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
    if (type === 'list') {
      const listObject = component.get('listObject')
      if (listObject !== undefined) {
        let listObjects: typeof listObject
        // Hard code some of this stuff for the videoSubStream list component for
        // now until we figure out a better solution
        if (/(vidoeSubStream|videoSubStream)/i.test(contentType || '')) {
          listObjects = (page?.object?.listData?.participants || []) as any[]
        } else {
          listObjects = _.isArray(listObject) ? listObject : [listObject]
        }
        component.assign({
          'data-listdata': listObjects,
          'data-listid': component.id,
        })
      } else {
        log.red(
          'A list component is missing the "listObject" property',
          component.snapshot(),
        )
      }
    }

    // The parent who's rendering this component has a reference to this itemObject from listObjects
    // and injects an item in the listObject array to here
    itemObject = component.get('itemObject')

    if (itemObject) {
      const drafted = getDraftedNodes()
      // Parent --> { component, itemObject, iteratorVar } = data
      // "parentId" was customly injected by our lib from the "list" component (refer to getChildren)
      parent = drafted[component.get('parentId') || '']
      if (!parent) {
        log.red(
          'No parent was attached to this "itemObject" component. props[\'data-value\'] will be undefined',
          { component: component.snapshot(), drafted, parent },
        )
      }
    }

    /* -------------------------------------------------------
      ---- REFERENCES
    -------------------------------------------------------- */
    if (_.isString(dataKey)) {
      // Component is retrieving data from a list
      if (dataKey.startsWith('itemObject')) {
        const listId = component.get('listId')
        const listItemIndex = component.get('listItemIndex')
        let data
        let path = dataKey.split('.').slice(1).join('.')
        // The data is coming from a list
        if (listId && _.isNumber(listItemIndex)) {
          itemObject = getListItem(listId, listItemIndex)
        } else {
          // This is the old (now deprecated) way. Leave this here for now until it's safe to remove
          const drafted = getDraftedNodes()
          parent = drafted[parentId || '']
          itemObject = _.get(parent, dataKey)
        }
        if (_.isObjectLike(itemObject)) {
          data = _.get(itemObject, path)
        } else {
          if (_.isString(itemObject)) {
            data = itemObject
          }
        }
        if (isReference(data)) {
          component.set(
            'data-value',
            showDataKey ? data : getFallbackDataValue(component),
          )
        } else {
          component.set('data-value', data)
        }

        if (!itemObject) {
          log.red(
            'Could not retrieve the itemObject data from this component',
            {
              component: component.snapshot(),
              dataValue: data,
              drafted: getDraftedNodes(),
              listData: getList(listId || ''),
              listItem: itemObject,
              listItemIndex,
              parent: getDraftedNode(parentId || ''),
            },
          )
        }

        if (data == undefined) {
          log.red(`Received undefined from itemObject`, {
            component,
            data,
            itemObject,
            listId,
            listItemIndex,
            path,
          })
        }
      } else {
        const data = parser.getByDataKey(dataKey)
        if (_.isString(data)) {
          if (isReference(data) || data.startsWith('itemObject')) {
            component.set(
              'data-value',
              showDataKey ? data : getFallbackDataValue(component),
            )
          }
        }
        if (!data) {
          log.red(
            `Attempted to use the dataKey "${dataKey}" to retrieve its ` +
              `data-value but received undefined instead`,
            {
              component: component.snapshot(),
              data,
              dataKey,
              drafted: getDraftedNodes(),
              context,
              localRoot: context.page.object,
              localRootKeySetTo: parser.getLocalKey(),
              showDataKey,
            },
          )
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
}

export default getCustomDataAttrs
