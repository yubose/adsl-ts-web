import * as u from '@jsmanifest/utils'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import set from 'lodash/set'
import { userEvent } from 'noodl-types'
import { excludeIteratorVar, findDataValue } from 'noodl-utils'
import type { ComponentObject, EcosDocument } from 'noodl-types'
import Resolver from '../Resolver'
import VP from '../Viewport'
import isNuiPage from '../utils/isPage'
import resolveReference from '../utils/resolveReference'
import { formatColor } from '../utils/common'
import is from '../utils/is'
import {
  findIteratorVar,
  findListDataObject,
  getByRef,
  isListConsumer,
  isListLike,
  resolveAssetUrl,
} from '../utils/noodl'
import log from '../utils/log'
import type { ConsumerOptions, NuiComponent, NUIActionObject } from '../types'
import type NuiPage from '../Page'
import cache from '../_cache'
import * as c from '../constants'

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
    on,
    page,
    resolveComponents,
  } = options

  callback?.(component)

  const mergingProps = on?.createComponent?.(component, {
    page,
    parent: component.parent,
    ...context,
  })

  try {
    const original = component.blueprint || {}
    const originalStyle = original.style || {}
    const { contentType, dataKey, path, text, textBoard } = original
    const iteratorVar =
      context?.iteratorVar || original.iteratorVar || findIteratorVar(component)
    /* -------------------------------------------------------
      ---- POPUP
    -------------------------------------------------------- */
    if (is.component.popUp(component)) {
      const message = component.get('message')
      if (message) {
        component.edit('message', message)
      }
    }

    /* -------------------------------------------------------
      ---- ECOSDOC
    -------------------------------------------------------- */

    if (is.component.ecosDoc(component)) {
      const ecosObj = component.get('ecosObj') as EcosDocument
      if (u.isObj(ecosObj)) {
        component.edit({
          mediaType: ecosObj.subtype?.mediaType,
          mimeType: ecosObj.name?.type,
          nameField: ecosObj.name,
        })
      } else {
        log.error(
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
      /** Filter invalid values (0 is a valid value)  */
      function getListObject(opts: ConsumerOptions) {
        let page = opts.page
        let pageName = ''
        if (u.isStr(page)) {
          pageName = page
          page = opts.getRootPage()
        } else if (isNuiPage(page)) {
          pageName = page.page
        }
        const _ref = opts.component?.props?._ref_
        let listObject =
          // component.blueprint.listObject || component.get('listObject')
          getByRef(opts.getRoot(),_ref,pageName) || component.blueprint.listObject || component.get('listObject')
        if (is.reference(listObject)) {
          component.edit(
            'listObject',
            resolveReference({
              component: opts.component,
              localKey: pageName,
              root: opts.getRoot(),
              key: 'listObject',
              page,
              value: listObject,
            }),
          )
          listObject = component.get('listObject')
        }
        return listObject
      }

      function getRawBlueprint(component: NuiComponent.Instance) {
        const childrenKey =
          component.type === 'chatList' ? 'chatItem' : 'children'
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
      let dataObjects = getListObject(options)
      if (
        u.isStr(dataObjects) &&
        ((iteratorVar && dataObjects.startsWith(iteratorVar)) ||
          dataObjects.startsWith('itemObject'))
      ) {
        let dataKey: any = dataObjects.toString()
        dataKey = excludeIteratorVar(dataKey, iteratorVar)
        dataObjects = get(findListDataObject(component), dataKey)
      }
      if (u.isArr(dataObjects)) {
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
            context: {
              ...context,
              ...ctx,
              path: context?.path
                ? context.path.concat('children', index)
                : ['children', index],
            },
            on: options.on,
            page,
          })
        }
      }
    }

    /* -------------------------------------------------------
      ---- PAGE
    -------------------------------------------------------- */

    if (is.component.page(component)) {
      let pageName = component.get('path')
      let page: NuiPage

      if (isNuiPage(options.page) && options.page.id !== 'root') {
        page = options.page
      } else {
        page = component.get('page') as NuiPage
      }

      if (!page) {
        if (cache.page.has(component.id)) {
          page = cache.page.get(component.id).page
        } else {
          page = createPage(component)
        }
      }

      page !== component.get('page') && component.edit('page', page)
      !page.viewport && (page.viewport = new VP())

      let viewportWidth = originalStyle.width
      let viewportHeight = originalStyle.height

      for (const key of ['width', 'height']) {
        const vpSize = key === 'width' ? viewportWidth : viewportHeight
        page.viewport[key] = VP.isNil(vpSize)
          ? getRootPage().viewport[key]
          : Number(
              VP.getSize(vpSize, options.viewport?.[key], {
                toFixed: 2,
              }),
            )
      }

      const isRemote = (str = '') =>
        str.startsWith('http') || str.endsWith('.html')

      if (u.isStr(pageName)) {
        const isEqual = page.page === pageName
        if (isEqual && !isRemote(pageName)) {
          u.isObj(mergingProps) && component.edit(mergingProps)
          return next?.()
        } else {
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

          !isEqual && (page.page = pageName)

          const onPageChange = async (page: NuiPage) => {
            try {
              await emit({
                type: c.nuiEmitType.TRANSACTION,
                transaction: c.nuiEmitTransaction.REQUEST_PAGE_OBJECT,
                params: page,
              })
              page.emit(c.nuiEvent.component.page.PAGE_CHANGED)
            } catch (error) {
              log.error(
                error instanceof Error ? error : new Error(String(error)),
              )
            }
          }

          try {
            // If the path corresponds to a page in the noodl, then the behavior is that it will navigate to the page in a window using the page object
            if (getPages().includes(pageName) || pageName === '') {
              getPages().includes(page.page) && (await onPageChange(page))
            } else {
              // Otherwise if it is a link (Only supporting html links / full URL's for now), treat it as an outside link
              if (!pageName.startsWith('http')) {
                page.page = resolveAssetUrl(pageName, getAssetsUrl())
              } else {
                page.page = pageName
              }
            }
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error(String(error))
            log.error(
              `[Page component] ` +
                `Error attempting to get the page object for a page component]: ${err.message}`,
              err.stack,
            )
          }

          const wrapOnPageChange =
            (fn: (...args: any[]) => any, page: NuiPage) => () =>
              fn(page)

          page.on(
            c.nuiEvent.component.page.PAGE_CHANGED,
            wrapOnPageChange(onPageChange, page),
          )
        }
      } else {
        log.error(
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
      is.component.plugin(component) ||
      is.component.pluginHead(component) ||
      is.component.pluginBodyTop(component) ||
      is.component.pluginBodyTail(component)
    ) {
      if (cache.plugin.has(path)) return next?.()

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
        if (/(text|javascript)/i.test(contentType)) {
          component.edit('content', await res?.text?.())
        } else {
          component.edit('content', await res?.json?.())
        }
        const content = await res?.json?.()
        plugin && (plugin.content = component.get('content'))
        setTimeout(() => component.emit('content', content || ''))
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        log.error(`[${err.name}]: ${err.message}`, err)
      } finally {
        plugin.initiated = true
      }
    }

    /* -------------------------------------------------------
      ---- TEXTBOARD (LABEL)
    -------------------------------------------------------- */

    if (is.component.label(original) && 'textBoard' in original) {
      if (u.isArr(textBoard)) {
        if (u.isStr(text)) {
          log.error(
            `%cA component cannot have a "text" and "textBoard" property because ` +
              `they both overlap. The "text" will take precedence.`,
            `color:#ec0000;font-weight:bold;`,
            component.toJSON(),
          )
        }

        textBoard.forEach((item) => {
          if (is.textBoardItem(item)) {
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
            let componentObject = {
              type: 'span',
              style: {
                // display: 'inline-block',
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
            }

            userEvent.forEach((event) => {
              item?.[event] && (componentObject[event] = item?.[event])
            })

            const text = createComponent(componentObject, page)

            userEvent.forEach((event) => {
              if (item?.[event]) {
                const actionChain = options.createActionChain(
                  event,
                  item[event] as NUIActionObject[],
                )
                if (options.on?.actionChain) {
                  actionChain.use(options.on.actionChain)
                }
                text.edit({ [event]: actionChain })
              }
            })
            component.createChild(text)
            callback?.(text)
          }
        })
      } else {
        log.error(
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

      isListConsumer(component) && (dataObject = findListDataObject(component))

      if (dataValue === undefined) {
        dataObject = findDataValue(
          [() => getRoot(), () => getRoot()[page.page]],
          dataKey,
        )
        dataValue = u.isObj(dataObject) ? get(dataObject, dataKey) : dataObject
      }

      if (u.isUnd(dataValue)) {
        log.error(
          `%cNo data object or value could be found for a component with contentType: "timer".`,
          `color:#ec0000;`,
          { component, dataKey, dataObject, dataValue },
        )
      } else {
        u.isObj(dataObject) && set(dataObject, dataKey, dataValue)
      }
    }

    /* -------------------------------------------------------
      ---- CHILDREN
    -------------------------------------------------------- */

    // Children of list components are created by the lib.
    // All other children are handled here
    if (!isListLike(component) && !is.component.page(component)) {
      if (u.isArr(component.blueprint?.children)) {
        const numChildren = component.blueprint.children.length
        for (let index = 0; index < numChildren; index++) {
          const childObject = component.blueprint.children[index]
          let _page = is.component.page(component.parent)
            ? component.parent.get('page')
            : page || page
          let child = createComponent(childObject, _page)
          child = component.createChild(child)
          child = await resolveComponents({
            callback,
            components: child,
            context: {
              ...context,
              path: context?.path
                ? context.path.concat('children', index)
                : ['children', index],
            },
            page: _page,
            on: options.on,
          })

          !cache.component.has(child) && cache.component.add(child, _page)
        }
      }
    }
    !cache.component.has(component) && cache.component.add(component, page)
  } catch (error) {
    log.error(error instanceof Error ? error : new Error(String(error)))
  }

  u.isObj(mergingProps) && component.edit(mergingProps)
  return next?.()
})

export default componentResolver
