import * as u from '@jsmanifest/utils'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import has from 'lodash/has'
import set from 'lodash/set'
import { ComponentObject, EcosDocument, Identify } from 'noodl-types'
import { findDataValue } from 'noodl-utils'
import Resolver from '../Resolver'
import createComponent from '../utils/createComponent'
import VP from '../Viewport'
import { formatColor, isPromise } from '../utils/common'
import {
  findIteratorVar,
  findListDataObject,
  isListConsumer,
  isListLike,
  publish,
  resolveAssetUrl,
} from '../utils/noodl'
import { ConsumerOptions, NUIComponent } from '../types'
import * as c from '../constants'

const componentResolver = new Resolver('resolveComponents')

componentResolver.setResolver((component, options, next) => {
  const {
    cache,
    context,
    createPage,
    createPlugin,
    createSrc,
    emit,
    getAssetsUrl,
    getRoot,
    getRootPage,
    page,
    resolveComponents,
  } = options

  const original = component.blueprint || {}
  const originalStyle = original.style || {}
  const { contentType, dataKey, path, text, textBoard } = original
  const iteratorVar =
    context?.iteratorVar || original.iteratorVar || findIteratorVar(component)

  /* -------------------------------------------------------
    ---- ECOSDOC
  -------------------------------------------------------- */

  if (Identify.component.ecosDoc(component)) {
    const ecosObj = component.get('ecosObj') as EcosDocument
    if (u.isObj(ecosObj)) {
      component.edit({
        mediaType: ecosObj.subtype?.mediaType,
        mimeType: ecosObj.name?.type,
        nameField: ecosObj.name,
      })
      if (!u.isObj(ecosObj.name)) {
        console.log(
          `%cAn ecosObj was received with a "name" field that was not an object. ` +
            `This will rely on the subtype to determine the type of document ` +
            `to generate the metadata for`,
          `color:#FF5722;`,
          { component, ecosObj },
        )
      }
    } else {
      console.log(
        `%cAn ecosDoc component did not have a valid "ecosObj" value`,
        `color:#ec0000;`,
        component,
      )
    }
  }

  /* -------------------------------------------------------
    ---- LIST
  -------------------------------------------------------- */

  if (isListLike(component)) {
    const listItemBlueprint = getRawBlueprint(component)

    function getChildrenKey(component: NUIComponent.Instance) {
      return component.type === 'chatList' ? 'chatItem' : 'children'
    }

    function getListObject() {
      if (u.isArr(component.blueprint.listObject)) {
        return component.blueprint.listObject
      }
      return []
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
      c.nuiEvent.component.list.ADD_DATA_OBJECT,
      ({ index, dataObject }) => {
        const ctx = { index, iteratorVar, dataObject }
        let listItem = component.createChild(createComponent(listItemBlueprint))
        listItem.ppath = `${component.ppath}.children[${index}]`
        listItem.edit({ index, [iteratorVar]: dataObject })
        listItem = resolveComponents({
          components: listItem,
          context: ctx,
          page,
        })
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
      c.nuiEvent.component.list.DELETE_DATA_OBJECT,
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
      c.nuiEvent.component.list.UPDATE_DATA_OBJECT,
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
      component.emit(c.nuiEvent.component.list.ADD_DATA_OBJECT, {
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
        const components = (
          pageObject?.components
            ? resolveComponents({
                components: pageObject.components,
                page: nuiPage,
                context,
              })
            : []
        ) as NUIComponent.Instance[]
        components?.forEach(component.createChild.bind(component))
        component.emit(c.nuiEvent.component.page.PAGE_COMPONENTS, components)
      })
      .catch((err: Error) => {
        throw new Error(
          `[Attempted to get page (${nuiPage.page}) object for a page component]: ${err.message}`,
        )
      })
  }

  /* -------------------------------------------------------
    ---- PLUGIN
  -------------------------------------------------------- */

  if (
    Identify.component.plugin(component) ||
    Identify.component.pluginHead(component) ||
    Identify.component.pluginBodyTail(component)
  ) {
    /**
     * Resolves the path, returning the final url
     * @param { string } path - Image path
     * @param { string } assetsUrl - Assets url
     * @param { function } createSrc
     */
    async function getPluginUrl(
      path: string,
      assetsUrl: string,
      createSrc: ConsumerOptions['createSrc'],
    ) {
      let url = createSrc(path)
      if (isPromise(url)) {
        const finalizedUrl = await url
        url = resolveAssetUrl(finalizedUrl, assetsUrl)
      }
      return url
    }

    if (cache.plugin.has(path)) return

    const plugin = createPlugin(component)
    component.set('plugin', plugin)

    getPluginUrl(path, getAssetsUrl(), createSrc)
      .then((src) => {
        // src is also being resolved in the resolveDataAttrs resolver
        // so we don't need to handle setting the data-src and emitting the
        // path event here
        if (src) return window.fetch?.(src)
      })
      .then((res) => res?.json?.())
      .then((content) => {
        plugin && (plugin.content = content)
        component.set('content', content).emit('content', content || '')
      })
      .catch((err) => console.error(`[${err.name}]: ${err.message}`, err))
      .finally(() => (plugin.initiated = true))
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
           * color ---> color
           * fontSize----> fontSize
           * fontWeight---> normal | bold | number
           */
          const text = createComponent({
            type: 'label',
            style: {
              display: 'inline-block',
              ...('color' in item
                ? { color: formatColor(item.color || '') }
                : undefined),
              ...('fontSize' in item
                ? {
                    fontSize:
                      item.fontSize.search(/[a-z]/gi) != -1
                        ? item.fontSize
                        : item.fontSize + 'px',
                  }
                : undefined),
              ...('fontWeight' in item
                ? { fontWeight: item.fontWeight }
                : undefined),
              ...('left' in item
                ? {
                    marginLeft: item.left.includes('px')
                      ? item.left
                      : `${item.left}px`,
                  }
                : undefined),
              ...('top' in item
                ? {
                    marginTop: item.top.includes('px')
                      ? item.top
                      : `${item.top}px`,
                  }
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
      dataValue = u.isObj(dataObject) ? get(dataObject, dataKey) : dataObject
    }

    if (u.isUnd(dataValue)) {
      console.log(
        `%cNo data object or value could be found for a component with contentType: "timer".`,
        `color:#ec0000;`,
        { component, dataKey, dataObject, dataValue },
      )
    } else {
      if (!u.isObj(dataObject)) {
        if (dataObject === dataValue) {
          //
        }
      } else {
        set(dataObject, dataKey, dataValue)
      }
    }
  }

  // Children of list components are created by the lib. All other children
  // are handled here
  if (!isListLike(component)) {
    component.blueprint?.children?.forEach?.(
      (childObject: ComponentObject, i) => {
        let child = createComponent(childObject)
        child = component.createChild(child)
        child.ppath = `${component.ppath || ''}.children[${i}]`
        child = resolveComponents({ components: child, context, page })
        !cache.component.has(child) && cache.component.add(child)
      },
    )
  }
  !cache.component.has(component) && cache.component.add(component)
  next?.()
})

export default componentResolver
