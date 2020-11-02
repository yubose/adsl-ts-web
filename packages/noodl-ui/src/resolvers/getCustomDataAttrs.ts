import _ from 'lodash'
import Logger from 'logsnap'
import isReference from '../utils/isReference'
import findList from '../utils/findList'
import { ResolverFn, IComponentTypeInstance } from '../types'

const log = Logger.create('getCustomDataAttrs')

/**
 * Attaches any custom data- attributes not handled in other resolvers
 *    (ex: "data-ux" for UX interactions between the library and the web app)
 */
const getCustomDataAttrs: ResolverFn = (component, options) => {
  const { context, showDataKey, getNode, getNodes, parser } = options
  const { page } = context

  let parent: IComponentTypeInstance

  const { type, contentType = '', dataKey, parentId, viewTag } = component.get([
    'type',
    'contentType',
    'dataKey',
    'parentId',
    'viewTag',
  ])

  if (component) {
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
    if (type === 'popUp') {
      component.set('data-ux', component.get('viewTag'))
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
    if (type === 'list') {
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

    /* -------------------------------------------------------
      ---- REFERENCES / DATAKEY 
    -------------------------------------------------------- */
    if (_.isString(dataKey)) {
      const isListDescendant = !!component.get('iteratorVar')
      // Component is retrieving data from a list
      if (dataKey.startsWith('itemObject')) {
        const listId = component.get('listId')
        const listItemIndex = component.get('listItemIndex')
        let data
        let path = dataKey.split('.').slice(1).join('.')
        // The data is coming from a list
        if (listId && _.isNumber(listItemIndex)) {
          itemObject = findList(getLists(), component)?.[
            listItemIndex as number
          ]
        } else {
          // This is the old (now deprecated) way. Leave this here for now until it's safe to remove
          const nodes = getNodes()
          parent = nodes[parentId || '']
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
            showDataKey
              ? data
              : component.get('text') || component.get('placeholder'),
          )
        } else {
          // Date components
          if (component.get('text=func')) {
            // These date components receive their values from a list
            if (dataKey.startsWith('itemObject')) {
              let path
              const listId = component.get('listId')
              const listItemIndex = component.get('listItemIndex')
              const lists = getLists()
              const listData = findList(lists, component)
              const dataObject = listData?.[listItemIndex as number]
              itemObject = dataObject

              if (!dataObject) {
                log.red(
                  'Expected a dataObject for a date component but received an invalid value instead',
                  {
                    component: component.snapshot(),
                    dataObject,
                    lists,
                    listData,
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
                  const ecosDate = _.get(itemObject, path)
                  if (ecosDate == undefined) {
                    const listItem = listData?.[listItemIndex as number]
                    log.red(
                      `Tried to retrieve the date value from an itemObject using ` +
                        `the path "${dataKey}" but received null or undefined instead`,
                      {
                        component: component.snapshot(),
                        lists,
                        listData,
                        listItem,
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
                      lists,
                      listData,
                      listItemIndex,
                      dataObject,
                      path,
                    },
                  )
                }
              }
            }
          } else {
            component.set('data-value', data)
          }
        }

        if (!itemObject) {
          log.red(
            'Could not retrieve the itemObject data from this component',
            {
              component: component.snapshot(),
              dataValue: data,
              nodes: getNodes(),
              listItem: itemObject,
              listItemIndex,
              parent: getNode(parentId || ''),
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
}

export default getCustomDataAttrs
