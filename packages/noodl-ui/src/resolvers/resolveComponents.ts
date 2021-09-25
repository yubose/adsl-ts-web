import * as u from '@jsmanifest/utils'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import has from 'lodash/has'
import set from 'lodash/set'
import type { ComponentObject, EcosDocument } from 'noodl-types'
import { Identify } from 'noodl-types'
import { excludeIteratorVar, findDataValue } from 'noodl-utils'
import Resolver from '../Resolver'
import type NUIPage from '../Page'
import VP from '../Viewport'
import { formatColor } from '../utils/common'
import {
  findIteratorVar,
  findListDataObject,
  isListConsumer,
  isListLike,
  resolveAssetUrl,
} from '../utils/noodl'
import type { NuiComponent } from '../types'
import cache from '../_cache'
import * as c from '../constants'
import * as i from '../utils/internal'

const componentResolver = new Resolver('resolveComponents')

componentResolver.setResolver(async (component, options, next) => {
  const {
    callback,
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

  callback?.(component)

  try {
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

      function getChildrenKey(component: NuiComponent.Instance) {
        return component.type === 'chatList' ? 'chatItem' : 'children'
      }

      /** Filter invalid values (0 is a valid value)  */
      function getListObject() {
        return u.array(component.blueprint.listObject).filter(Boolean)
      }

      function getRawBlueprint(component: NuiComponent.Instance) {
        const childrenKey = getChildrenKey(component)
        const children = component.blueprint.children
        const blueprint = cloneDeep(u.isArr(children) ? children[0] : children)
        if (u.isObj(blueprint) && childrenKey === 'chatItem') {
          blueprint.type = 'listItem'
        }
        return blueprint as ComponentObject
      }

      // Removes the placeholder (first child)
      component.clear('children')

      // Customly create the listItem children using a dataObject as the data source

      let dataObjects = getListObject()
      if (
        dataObjects.length == 1 &&
        u.isStr(dataObjects[0]) &&
        dataObjects[0].startsWith('itemObject')
      ) {
        let dataKey: any = dataObjects[0].toString()
        dataKey = excludeIteratorVar(dataKey, iteratorVar)
        dataObjects = get(findListDataObject(component), dataKey)
      }
      const numDataObjects = dataObjects.length
      for (let index = 0; index < numDataObjects; index++) {
        const dataObject = dataObjects[index]
        const ctx = { index, iteratorVar, dataObject }
        let listItem = createComponent(listItemBlueprint, page)
        listItem = component.createChild(listItem)
        listItem.edit({ index, [iteratorVar]: dataObject })
        listItem = await resolveComponents({
          callback,
          components: listItem,
          context: { ...context, ...ctx },
          on: options.on,
          page,
        })
      }
    }

    /* -------------------------------------------------------
      ---- PAGE
    -------------------------------------------------------- */

    if (Identify.component.page(component)) {
      let pageName = component.get('path') || ''
      let page = component.get('page') as NUIPage

      if (!page) {
        if (pageName) {
          page = [...cache.page.get().values()].find(
            (obj) => obj?.page === pageName,
          )?.page as NUIPage
        } else {
          page = createPage(component) as NUIPage
        }
      }

      !page && (page = createPage(component) as NUIPage)
      page !== component.get('page') && component.edit('page', page)

      if (!component.has('parentPage')) {
        component.edit(
          'parentPage',
          options?.page?.page || options.getRootPage().page,
        )
      }

      let viewport = page?.viewport

      if (!viewport) {
        viewport = new VP()
        page.viewport = viewport
      }

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

      const isRemote = (str = '') =>
        str.startsWith('http') || str.endsWith('.html')

      if (u.isStr(pageName)) {
        const isEqual = page.page === pageName
        if (isEqual && !isRemote(pageName)) return next?.()

        if (page.page === '' && pageName) {
          // Assuming it was loading its page object and just received it
        } else if (page.page && pageName === '') {
          // Assuming it was active but is now entering in its idle/closing state
        } else if (!isEqual) {
          // Transitioning from a previous page to a new page
          if (!component.get('page')) {
            if (cache.page.has(component.id)) {
              component.set('page', cache.page.get(component.id).page)
            }
          }
        }

        if (!isEqual) {
          page.page = pageName
        }

        const onPageChange = async () => {
          try {
            await emit({
              type: c.nuiEmitType.TRANSACTION,
              transaction: c.nuiEmitTransaction.REQUEST_PAGE_OBJECT,
              params: page,
            })
            page.emit(c.nuiEvent.component.page.PAGE_CHANGED)
          } catch (error) {
            console.error(error)
          }
        }

        try {
          // If the path corresponds to a page in the noodl, then the behavior is that it will navigate to the page in a window using the page object
          if (getPages().includes(pageName) || pageName === '') {
            getPages().includes(page.page) && (await onPageChange())
          } else {
            // Otherwise if it is a link (Only supporting html links / full URL's for now), treat it as an outside link
            if (!pageName.startsWith('http')) {
              page.page = resolveAssetUrl(pageName, getAssetsUrl())
            } else {
              page.page = pageName
            }
          }
        } catch (err: any) {
          // TODO - handle this. Maybe cleanup?
          console.error(
            `[Page component] ` +
              `Error attempting to get the page object for a page component]: ${err.message}`,
            err.stack?.() || new Error(err),
          )
        }

        page.on(c.nuiEvent.component.page.PAGE_CHANGED, onPageChange)
      } else {
        console.log(
          `%cThe pageName was not a string when resolving the page name for a page component`,
          `color:#ec0000;`,
          component.toJSON(),
        )
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
      if (cache.plugin.has(path)) {
        // callback?.(component)
        return next?.()
      }

      const plugin = createPlugin(component)
      component.set('plugin', plugin)

      try {
        // src is also being resolved in the resolveDataAttrs resolver
        // so we don't need to handle setting the data-src and emitting the
        // path event here
        const src = resolveAssetUrl(
          // @ts-expect-error
          await createSrc(path, { component, key: 'path', page }),
          getAssetsUrl(),
        )
        const res = await window.fetch?.(src)
        const headers = res?.headers
        const contentType = headers?.get?.('Content-Type') || ''
        const url = res?.url
        if (/(text|javascript)/i.test(contentType)) {
          component.edit('content', await res?.text?.())
        } else {
          component.edit('content', await res?.json?.())
        }
        const content = await res?.json?.()
        plugin && (plugin.content = component.get('content'))
        setTimeout(() => component.emit('content', content || ''))
      } catch (err: any) {
        console.error(`[${err.name}]: ${err.message}`, err)
      } finally {
        plugin.initiated = true
      }
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
            const child = createComponent('br', page)
            callback?.(child)
            component.createChild(child)
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
            if (item?.dataKey) {
              if (iteratorVar && item?.dataKey.startsWith(iteratorVar)) {
                const dataObject = findListDataObject(component)
                const dataKey = excludeIteratorVar(item?.dataKey, iteratorVar)
                item.text = dataKey ? get(dataObject, dataKey) : dataObject
              } else {
                const dataObject = findDataValue(
                  [() => getRoot(), () => getRoot()[page.page]],
                  item?.dataKey,
                )
                item.text = u.isObj(dataObject)
                  ? get(dataObject, item?.datKey)
                  : dataObject
              }
            }
            const text = createComponent(
              {
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
              },
              page,
            )
            component.createChild(text)
            callback?.(text)
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

    // Children of list components are created by the lib.
    // All other children are handled here
    if (!isListLike(component) && !Identify.component.page(component)) {
      if (u.isArr(component.blueprint?.children)) {
        for (const childObject of component.blueprint.children) {
          let _page = Identify.component.page(component.parent)
            ? component.parent.get('page')
            : page || page
          let child = createComponent(childObject, _page)
          child = component.createChild(child)
          child = await resolveComponents({
            callback,
            components: child,
            context,
            page: _page,
            on: options.on,
          })
          !cache.component.has(child) && cache.component.add(child, _page)
        }
      }
    }

    !cache.component.has(component) && cache.component.add(component, page)
  } catch (error) {
    console.error(error)
  }

  return next?.()
})

export default componentResolver
