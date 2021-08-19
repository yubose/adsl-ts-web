import * as u from '@jsmanifest/utils'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import has from 'lodash/has'
import set from 'lodash/set'
import type { ComponentObject, EcosDocument } from 'noodl-types'
import { Identify } from 'noodl-types'
import { findDataValue } from 'noodl-utils'
import Resolver from '../Resolver'
import type NUIPage from '../Page'
import VP from '../Viewport'
import { formatColor, isPromise } from '../utils/common'
import {
  findIteratorVar,
  findListDataObject,
  isListConsumer,
  isListLike,
  resolveAssetUrl,
} from '../utils/noodl'
import type { ConsumerOptions, NUIComponent } from '../types'
import * as c from '../constants'

const componentResolver = new Resolver('resolveComponents')

componentResolver.setResolver((component, options, next) => {
  const {
    callback,
    cache,
    context,
    createComponent,
    createPage,
    createPlugin,
    createSrc,
    emit,
    getAssetsUrl,
    getPages,
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
            `to determine the metadata`,
          `color:#FF5722;`,
          { component, ecosObj },
        )
      }
    } else {
      console.log(
        `%cAn ecosDoc component had an empty "ecosObj" value`,
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

    /** Filter invalid values (0 is a valid value)  */
    function getListObject() {
      return u.array(component.blueprint.listObject).filter(Boolean)
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
        let listItem = createComponent(listItemBlueprint)
        listItem = component.createChild(listItem)
        listItem.edit({ index, [iteratorVar]: dataObject })
        listItem = resolveComponents({
          callback,
          components: listItem,
          context: { ...context, ...ctx },
          page,
        })
      },
      c.nuiEvent.component.list.ADD_DATA_OBJECT,
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
    let nuiPage = component.get('page') || cache.page.get(component.id)?.page
    let pageName = component.get('path') || ''

    if (u.isStr(pageName)) {
      if (!nuiPage) {
        nuiPage = createPage({
          id: component.id,
          component,
          name: pageName,
        }) as NUIPage
        component.edit('page', nuiPage)
        component.emit(c.nuiEvent.component.page.PAGE_CREATED, nuiPage)
      }

      !pageName && (pageName = component.get('path'))
      pageName && nuiPage.page !== pageName && (nuiPage.page = pageName)

      if (nuiPage) {
        if (!nuiPage.page) {
          console.log(
            `%cThe page component does not have its page name resolved yet`,
            `color:#ec0000;`,
            { component, options },
          )
          return
        }
        ;(async () => {
          try {
            // If the path corresponds to a page in the noodl, then the behavior is that it will navigate to the page in a window
            if (getPages().includes(pageName)) {
              const onPageChange = async (initializing = false) => {
                !component.get('page') && component.edit('page', nuiPage)
                await emit({
                  type: c.nuiEmitType.TRANSACTION,
                  transaction: c.nuiEmitTransaction.REQUEST_PAGE_OBJECT,
                  params: nuiPage,
                })
                component.emit(c.nuiEvent.component.page.PAGE_COMPONENTS, {
                  page: nuiPage,
                  type: initializing ? 'init' : 'update',
                })
              }
              component.edit('page', nuiPage)
              component.on(c.nuiEvent.component.page.PAGE_CHANGED, onPageChange)
              await onPageChange(true)
            } else {
              // Otherwise if it is a link (Only supporting html links / full URL's for now), treat it as an outside link
              if (pageName.endsWith('.html')) {
                if (!pageName.startsWith('http')) {
                  pageName = resolveAssetUrl(pageName, getAssetsUrl())
                }
                nuiPage.page = pageName
                component.edit('page', nuiPage)
              } else {
                // TODO
              }
            }
          } catch (err) {
            // TODO - handle this. Maybe cleanup?
            console.error(
              `[Page component] ` +
                `Error attempting to get the page object for a page component]: ${err.message}`,
              err,
            )
          }
        })()
      } else {
      }

      let viewport = nuiPage.viewport || new VP()

      if (VP.isNil(originalStyle.width)) {
        viewport.width = getRootPage().viewport.width
      } else {
        viewport.width = Number(
          VP.getSize(originalStyle.width, options.viewport?.width, {
            toFixed: 2,
          }),
        )
      }

      if (VP.isNil(originalStyle.height)) {
        viewport.height = getRootPage().viewport.height
      } else {
        viewport.height = Number(
          VP.getSize(originalStyle.height, options.viewport?.height, {
            toFixed: 2,
          }),
        )
      }
    }
  }

  /* -------------------------------------------------------
    ---- PLUGIN
  -------------------------------------------------------- */

  if (
    Identify.component.plugin(component) ||
    Identify.component.pluginHead(component) ||
    Identify.component.pluginBodyTop(component) ||
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
      .then((res) => {
        const headers = res?.headers
        const contentType = headers?.get?.('Content-Type') || ''
        const url = res?.url
        if (/(text|javascript)/i.test(contentType)) return res?.text?.()
        return res?.json?.()
      })
      .then((content) => {
        plugin && (plugin.content = content)
        component.set('content', content)
        component.emit('content', content || '')
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
        //
      } else {
        set(dataObject, dataKey, dataValue)
      }
    }
  }

  /* -------------------------------------------------------
    ---- CHILDREN 
  -------------------------------------------------------- */

  // Children of list components are created by the lib. All other children
  // are handled here
  if (!isListLike(component) && !Identify.component.page(component)) {
    component.blueprint?.children?.forEach?.(
      (childObject: ComponentObject, i) => {
        let child = createComponent(childObject)
        child = component.createChild(child)
        child = resolveComponents({
          callback,
          components: child,
          context,
          page,
        })
        !cache.component.has(child) && cache.component.add(child, page)
      },
    )
  }

  !cache.component.has(component) && cache.component.add(component, page)

  next?.()
})

export default componentResolver
