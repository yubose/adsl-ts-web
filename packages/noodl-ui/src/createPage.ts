// @ts-nocheck
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import cache from './_cache'
import isComponent from './utils/isComponent'
import isViewport from './utils/isViewport'
import NuiViewport from './Viewport'
import NuiPage from './Page'
import * as c from './constants'
import * as t from './types'

export default function createPage(
  getRoot: () => Record<string, any> = () => ({}),
  args?:
    | string
    /**
     * If a component instance is given, we must set its page id to the component id, emit the PAGE_CREATED component event and set the "page" prop using the page instance
     */
    | t.NuiComponent.Instance
    | {
        name?: string
        component?: t.NuiComponent.Instance
        id?: string
        onChange?(prev: string, next: string): void
        viewport?: NuiViewport | { width?: number; height?: number }
      },
  opts:
    | {
        onChange?(prev: string, next: string): void
        viewport?: NuiViewport | { width?: number; height?: number }
      }
    | never = {},
) {
  let name: string = ''
  let id: string | undefined = undefined
  let onChange: ((prev: string, next: string) => void) | undefined
  let page: NuiPage | undefined
  let viewport: NuiViewport | undefined

  if (u.isStr(args)) {
    name = args
    if (opts?.viewport) {
      if (opts.viewport instanceof NuiViewport) viewport = opts.viewport
      else if (u.isObj(opts.viewport)) viewport = new NuiViewport(opts.viewport)
    }
  } else if (isComponent(args)) {
    id = args.id
    page = args.get('page') || cache.page.get(args.id)?.page
    name = String(args.get('path') || '')
    page && args.get('page') !== page && args.edit('page', page)
  } else if (u.isObj(args)) {
    args.name && (name = args.name)
    args.onChange && (onChange = args.onChange)
    if (isComponent(args.component)) args.id = args.component.id
    else id = args.id || id || ''
    if (args?.viewport) {
      if (isViewport(args.viewport)) viewport = args.viewport
      else if (u.isObj(args.viewport)) viewport = new NuiViewport(args.viewport)
    }
  }

  let isPreexistent = false

  if (name) {
    for (const obj of cache.page) {
      if (obj) {
        const [_, { page: _prevPage }] = obj
        if (_prevPage.page === name) {
          page = _prevPage
          isPreexistent = true

          // Delete the cached components from the page since it will be
          // re-rerendered
          for (const obj of cache.component) {
            if (obj && obj.page === page?.page) {
              if (nt.Identify.component.page(obj.component)) continue
              cache.component.remove(obj.component)
            }
          }
        }
      }
    }
  }

  if (!isPreexistent) {
    page = cache.page.create({
      id,
      onChange,
      viewport,
    }) as NuiPage
    if (isComponent(args)) {
      page.page = name
      args.edit('page', page)
      args.emit(c.nuiEvent.component.page.PAGE_CREATED, page)
    } else if (!u.isStr(args) && isComponent(args?.component)) {
      /**
       * Transfer the page from page component to be stored in the WeakMap
       * Page components being stored in Map are @deprecated because of
       * caching issues, whereas WeakMap will garbage collect by itself
       * in a more aggressive way
       */
      console.info(`[noodl-ui] isPreexistent - Removing page "${page.id}"`)
      cache.page.remove(page)
      const component = args?.component as t.NuiComponent.Instance
      page = cache.page.create({ id: component.id, onChange })
    }
  }

  name && page && page.page !== name && (page.page = name)
  ;(page as NuiPage)?.use(() => getRoot()[page?.page || '']?.components)

  return page
}
