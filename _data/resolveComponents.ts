import get from 'lodash/get'
import has from 'lodash/has'
import set from 'lodash/set'
import { ComponentObject, Identify } from 'noodl-types'
import { findDataValue, isBreakLineTextBoardItem } from 'noodl-utils'
import { ComponentInstance, ConsumerOptions } from '../types'
import Resolver from '../Resolver'
import createComponent from '../utils/createComponent'
import { formatColor } from '../utils/common'
import {
  findIteratorVar,
  findListDataObject,
  findParent,
  isListConsumer,
  isListLike,
  publish,
} from '../utils/noodl'
import * as c from '../constants'
import * as u from '../utils/internal'

function resolveComponents(
  component: ComponentInstance,
  options: ConsumerOptions,
) {
  const {
    cache,
    context,
    createPage,
    getRoot,
    getRootPage,
    page,
    resolveComponents,
  } = options

  const original = component.original || {}
  const originalStyle = original.style || {}
  const { contentType, dataKey, path, text, textBoard, type } = original

  function getChildrenKey() {
    return type === 'chatList' ? 'chatItem' : 'children'
  }

  /* -------------------------------------------------------
    ---- LIST
  -------------------------------------------------------- */

  debugger

  if (isListLike(component)) {
    function getListObject() {
      return original.listObject || []
    }

    function getRawBlueprint(component: ComponentInstance) {
      const childrenKey = getChildrenKey()
      const children = component.original?.[childrenKey]
      const blueprint = u.isArr(children) ? { ...children?.[0] } : children
      if (u.isObj(blueprint) && childrenKey === 'chatItem') {
        blueprint.type = 'listItem'
      }
      return blueprint as ComponentObject
    }

    const childBlueprint = getRawBlueprint(component)
    const iteratorVar = findIteratorVar(component)

    function drawListItemChildren(args: {
      component: ComponentInstance
      dataObject: any
      index: number
    }) {
      args?.component?.blueprint?.children?.forEach?.(
        (child: ComponentObject) => {
          let childInstance = createComponent(child)
          childInstance = resolveComponents({
            components: args.component.createChild(childInstance),
            page,
            context: {
              index: args.index,
              iteratorVar,
              dataObject: args.dataObject,
            },
          })
          if (childInstance?.blueprint?.children?.length) {
            drawListItemChildren({
              component: childInstance,
              dataObject: args.dataObject,
              index: args.index,
            })
          }
        },
      )

      return args.component
    }

    // Creates list items as new data objects are added
    component.on(
      c.event.component.list.ADD_DATA_OBJECT,
      ({ index, dataObject }) => {
        let listItem = component.createChild(createComponent(childBlueprint))
        listItem.edit({ [iteratorVar]: dataObject })
        listItem = resolveComponents({
          components: listItem,
          page,
          context: { index, iteratorVar, dataObject },
        })
        if (listItem?.blueprint?.children?.length) {
          drawListItemChildren({ component: listItem, dataObject, index })
        }
      },
      'ADD_DATA_OBJECT',
    )

    // Removes list items when their data object is removed
    component.on(
      c.event.component.list.DELETE_DATA_OBJECT,
      (result, args) => {
        const listItem = component?.children?.find(
          (child) => child.get(iteratorVar) === result.dataObject,
        )

        const liProps = listItem?.props() || {}

        liProps[iteratorVar] = null

        if (listItem) {
          component.removeChild()
          cache.component.remove(listItem)
          publish(listItem, (c) => {
            console.log(`%cRemoving from cache: ${c.id}`, `color:#00b406`)
            cache.component.remove(c)
          })
        }
        component.emit(c.event.component.list.REMOVE_LIST_ITEM, {
          ...result,
          listItem,
        })
      },
      'DELETE_DATA_OBJECT',
    )

    // Updates list items with new updates to their data object
    component.on(
      c.event.component.list.UPDATE_DATA_OBJECT,
      (result, options) => {
        const { index, dataObject } = result
        const listItem = component.children?.[index]
        listItem.edit({ [iteratorVar]: dataObject })
        component.emit(
          c.event.component.list.UPDATE_LIST_ITEM,
          { ...result, listItem },
          options,
        )
      },
      'UPDATE_DATA_OBJECT',
    )

    // Removes the placeholder (first child)
    component.clearChildren()

    // Customly create the listItem children using a dataObject as the data source
    getListObject().forEach((dataObject: any, index: number) => {
      component.emit(c.event.component.list.ADD_DATA_OBJECT, {
        index,
        dataObject,
      })
    })
  }

  /* -------------------------------------------------------
    ---- PAGE
  -------------------------------------------------------- */

  if (type === 'page') {
    const newPage = createPage(path)
    const viewport = newPage.viewport

    if (originalStyle.width === undefined) {
      viewport.width = getRootPage().viewport.width
    } else {
      viewport.width = Number(String(originalStyle.width).replace('px', ''))
    }

    if (originalStyle.height === undefined) {
      viewport.height = getRootPage().viewport.height
    } else {
      viewport.height = Number(String(originalStyle.height).replace('px', ''))
    }

    component.edit('page', newPage)

    const pageObject = getRoot()[newPage.page]

    if (pageObject) {
      console.log(`%cPage object grabbed`, `color:#c4a901;`, {
        component,
        pageObject,
        path,
      })
    } else if (!pageObject) {
      console.log(
        `%cExpected a page object but received ${typeof pageObject}`,
        `color:#ec0000;font-weight:bold;`,
        { component, pageObject, path },
      )
    }

    // Setting a timeout allows this call to run after consumers attach
    // listeners to this component, which will allow them to catch this
    // event when attaching listeners

    const newPageComponents = (pageObject?.components
      ? resolveComponents(pageObject.components)
      : []) as ComponentInstance[]

    // Add these components to the page component (the goal here is to provide a
    // "sandboxed" environment for further processing)
    newPageComponents?.forEach((c) => {
      component.createChild(c)
      c?.setParent?.(component)
    })

    setTimeout(() =>
      component.emit(
        c.event.component.page.RESOLVED_COMPONENTS,
        newPageComponents,
      ),
    )
  }

  /* -------------------------------------------------------
    ---- SCROLLVIEW
  -------------------------------------------------------- */

  if (Identify.component.scrollView(original)) {
    original.children?.forEach((origChild) => {
      const child = resolveComponents({ page, components: origChild })
      child.style.position = 'relative'
    })
  }

  /* -------------------------------------------------------
    ---- TEXTBOARD (LABEL)
  -------------------------------------------------------- */

  if (Identify.component.label(original) && 'textBoard' in original) {
    if (u.isArr(textBoard)) {
      if (u.isStr(text)) {
        console.log(
          `%cA component cannot have a "text" and "textBoard" property because ` +
            `they both overlap. The "text" will take precedence.`,
          `color:#ec0000;font-weight:bold;`,
          component.toJSON(),
        )
      }

      textBoard.forEach((item) => {
        if (isBreakLineTextBoardItem(item)) {
          component.createChild(createComponent('br'))
        } else {
          /**
           * NOTE: Normally in the return type we would return the child
           * component wrapped with a resolveComponent call but it is conflicting
           * with our custom implementation because its being assigned unwanted style
           * attributes like "position: absolute" which disrupts the text display.
           * TODO: Instead of a resolverComponent, we should make a resolveStyles
           * to get around this issue. For now we'll hard code known props like "color"
           */
          const text = createComponent({
            type: 'label',
            style: {
              display: 'inline-block',
              ...('color' in item
                ? { color: formatColor(item.color || '') }
                : undefined),
            },
            text: 'text' in item ? item.text : '',
          })
          component.createChild(text)
        }
      })
    } else {
      console.log(
        `%cExpected textBoard to be an array but received "${typeof textBoard}". ` +
          `This part of the component will not be included in the output`,
        `color:#ec0000;font-weight:bold;`,
        { component, textBoard },
      )
    }
  }

  /* -------------------------------------------------------
    ---- TIMERS (LABEL)
  -------------------------------------------------------- */

  if (contentType === 'timer' && dataKey) {
    let dataObject: any
    let dataValue: any

    let isPageDescendant: boolean
    let isListDescendant = isListConsumer(component)

    findParent(component, (p) => {
      if (p?.type === 'page') return (isPageDescendant = true)
      return false
    })

    if (isListDescendant) {
      dataObject = findListDataObject(component)
      if (!has(dataObject, dataKey)) {
        console.log(
          `%cA path does not exist at ${dataKey}. Skipping the query and ` +
            `moving to higher level now...`,
          `color:#ec0000;`,
          { component, dataKey, dataObject },
        )
      } else {
        console.log(
          `%cThe path ${dataKey} exists in a data object. Retrieving its ` +
            `value from there now...`,
          `color:#00b406;`,
          {
            component,
            dataKey,
            dataObject,
            dataValue: (dataValue = get(dataObject, dataKey)),
          },
        )
      }
    }

    if (dataValue === undefined) {
      dataObject = findDataValue(
        [() => getRoot(), () => getRoot()[page.page]],
        dataKey,
      )

      if (u.isObj(dataObject)) {
        dataValue = get(dataObject, dataKey)
      } else {
        dataValue = dataObject
      }
    }

    if (dataValue === undefined) {
      console.log(
        `%cNo data object or value could be found.`,
        `color:#ec0000;`,
        {
          component,
          dataKey,
          dataObject,
          dataValue,
        },
      )
    } else {
      set(dataObject, dataKey, dataValue)
    }
  }
}

export default resolveComponents
