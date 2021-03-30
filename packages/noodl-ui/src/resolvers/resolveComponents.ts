import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import has from 'lodash/has'
import set from 'lodash/set'
import { ComponentObject, Identify } from 'noodl-types'
import { findDataValue } from 'noodl-utils'
import Resolver from '../Resolver'
import createComponent from '../utils/createComponent'
import VP from '../Viewport'
import { formatColor } from '../utils/common'
import {
  findIteratorVar,
  findListDataObject,
  isListConsumer,
  isListLike,
  publish,
} from '../utils/noodl'
import { NUIComponent } from '../types'
import * as c from '../constants'
import * as u from '../utils/internal'

const componentResolver = new Resolver('resolveComponents')

componentResolver.setResolver((component, options, next) => {
  const {
    cache,
    context,
    createPage,
    emit,
    getRoot,
    getRootPage,
    page,
    resolveComponents,
  } = options

  const original = component.blueprint || {}
  const originalStyle = original.style || {}
  const { contentType, dataKey, path, text, textBoard, type } = original
  const iteratorVar =
    context?.iteratorVar ||
    (Identify.component.list(component)
      ? component.get('iteratorVar') || ''
      : findIteratorVar(component))

  /* -------------------------------------------------------
    ---- LIST
  -------------------------------------------------------- */

  if (isListLike(component)) {
    const listItemBlueprint = getRawBlueprint(component)

    function getChildrenKey(component: NUIComponent.Instance) {
      return component.type === 'chatList' ? 'chatItem' : 'children'
    }

    function getListObject() {
      return component.blueprint?.listObject || []
    }

    function getRawBlueprint(component: NUIComponent.Instance) {
      const childrenKey = getChildrenKey(component)
      const children = component.blueprint.children
      const blueprint = cloneDeep(u.isArr(children) ? children[0] : children)
      if (u.isObj(blueprint) && childrenKey === 'chatItem') {
        blueprint.type = 'listItem'
      }
      return blueprint as ComponentObject
    }

    // Creates list items as new data objects are added
    component.on(
      c.event.component.list.ADD_DATA_OBJECT,
      ({ index, dataObject }) => {
        const ctx = { index, iteratorVar, dataObject }
        let listItem = createComponent(listItemBlueprint)
        listItem = component.createChild(listItem)
        listItem.edit({ [iteratorVar]: dataObject })
        listItem = resolveComponents({
          components: listItem,
          context: ctx,
          page,
        })
        // listItem.blueprint?.children?.forEach((child) => {
        //   resolveComponents({
        //     components: listItem?.createChild(createComponent(child)),
        //     page,
        //     context: ctx,
        //   })
        // })
        cache.component.add(listItem)
        const numGeneratedChildren = listItem.length
        const expectedNumChildren = listItem.blueprint?.children?.length
        if (listItem.length > (listItem.blueprint?.children?.length || 0)) {
          console.log(
            `%cA listItem has more children (${numGeneratedChildren}) than what its blueprint represents (${expectedNumChildren})`,
            `color:#ec0000;`,
            { list: component, listItem, dataObject, index },
          )
        }
      },
      'ADD_DATA_OBJECT',
    )

    // Removes list items when their data object is removed
    component.on(
      c.event.component.list.DELETE_DATA_OBJECT,
      (args) => {
        const listItem = component?.children?.find(
          (child) => child.get(iteratorVar) === args.dataObject,
        )
        if (listItem) {
          const liProps = listItem.props
          liProps[iteratorVar] = ''
          if (listItem) {
            component.removeChild(listItem)
            cache.component.remove(listItem)
            publish(listItem, (c) => {
              console.log(`%cRemoving from cache: ${c.id}`, `color:#00b406`)
              cache.component.remove(c)
            })
          }
        }
      },
      'DELETE_DATA_OBJECT',
    )

    // Updates list items with new updates to their data object
    component.on(
      c.event.component.list.UPDATE_DATA_OBJECT,
      (args) => {
        component.children?.[args.index]?.edit?.({
          [iteratorVar]: args.dataObject,
        })
      },
      'UPDATE_DATA_OBJECT',
    )

    // Removes the placeholder (first child)
    component.clear('children')

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

  if (Identify.component.page(component)) {
    const nuiPage = createPage({ id: component.id, name: path })
    const viewport = nuiPage.viewport

    if (u.isNil(originalStyle.width)) {
      viewport.width = getRootPage().viewport.width
    } else {
      viewport.width = Number(
        VP.getSize(originalStyle.width, getRootPage().viewport.width, {
          toFixed: 2,
        }),
      )
    }

    if (u.isNil(originalStyle.height)) {
      viewport.height = getRootPage().viewport.height
    } else {
      viewport.height = Number(
        VP.getSize(originalStyle.height, getRootPage().viewport.height, {
          toFixed: 2,
        }),
      )
    }

    component.edit('page', nuiPage)

    nuiPage.page = path

    emit({
      type: c.nuiEmitType.TRANSACTION,
      transaction: c.nuiEmitTransaction.REQUEST_PAGE_OBJECT,
      params: nuiPage,
    })
      .then((pageObject) => {
        console.log(
          `%cReceived page object from transaction "${c.nuiEmitTransaction.REQUEST_PAGE_OBJECT}"`,
          `color:#e50087;`,
          pageObject,
        )
        const components = (pageObject?.components
          ? resolveComponents({
              components: pageObject.components,
              page: nuiPage,
            })
          : []) as NUIComponent.Instance[]
        components?.forEach(component.createChild.bind(component))
        component.emit(c.event.component.page.PAGE_COMPONENTS, components)
      })
      .catch((err: Error) => {
        throw new Error(
          `[Attempted to get page (${nuiPage.page}) object for a page component]: ${err.message}`,
        )
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
        if (Identify.textBoardItem(item)) {
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

    if (isListConsumer(component)) {
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

  // Children of list components are created by the lib. All other children
  // are handled here
  if (!isListLike(component)) {
    component.blueprint?.children?.forEach?.((childObject: ComponentObject) => {
      const child = component.createChild(
        resolveComponents({ components: childObject, context, page }),
      )
      !cache.component.has(child) && cache.component.add(child)
    })
  }
  !cache.component.has(component) && cache.component.add(component)

  next?.()
})

export default componentResolver
