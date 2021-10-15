/**
 * Internal utilities (not exported)
 */
import * as u from '@jsmanifest/utils'
import curry from 'lodash/curry'
import get from 'lodash/get'
import { Identify } from 'noodl-types'
import { isPage as isNuiPage, publish, isComponent } from 'noodl-ui'
import type { ComponentObject, EcosDocument, NameField } from 'noodl-types'
import type { NuiComponent, Page as NUIPage } from 'noodl-ui'
import type { ComponentPage } from '../factory/componentFactory'
import type GlobalComponentRecord from '../global/GlobalComponentRecord'
import type NDOM from '../noodl-ui-dom'
import type NDOMPage from '../Page'
import isComponentPage from './isComponentPage'
import isNDOMPage from './isPage'
import { cache } from '../nui'
import * as c from '../constants'
import * as t from '../types'

export const _DEV_ = process.env.NODE_ENV === 'development'
export const _TEST_ = process.env.NODE_ENV === 'test'

export function addClassName(className: string, node: HTMLElement) {
  if (!node.classList.contains(className)) {
    node.classList.add(className)
  }
}

type CreateDocIdentifierArg =
  | NuiComponent.Instance
  | ComponentObject
  | EcosDocument<NameField>
  | null
  | undefined

function _createDocIdentifier(
  mediaType: number,
  regex: { value: string; flags?: string },
): (obj: CreateDocIdentifierArg) => boolean
function _createDocIdentifier(
  mediaType: number,
  regex: string,
): (obj: CreateDocIdentifierArg) => boolean
function _createDocIdentifier(
  mediaType: number,
  regexStr: string | { value: string; flags?: string },
) {
  /**
   * A helper to grab a value from key from a component or action
   * @param { NuiComponent | ComponentObject | NUIAction | NUIActionObjectInput } obj
   * @param { string } key
   */
  function _pick(obj: any, key: string, defaultValue?: any) {
    if (!u.isObj(obj)) return obj
    let result
    if (key === 'name.type') {
      if (obj?.name?.type) {
        const val = get(obj, key)
        if (val !== undefined && !val) return false
      }
    }
    u.isFnc(obj.get) && (result = obj.get(key))
    u.isUnd(result) && (result = get(obj, key))
    u.isUnd(result) && (result = get(obj.blueprint, key))
    return result || defaultValue
  }
  // TODO - Docx files is being detected as PDF -- which prompts downloading
  // TODO - Read possible feat. for viewing docx files https://stackoverflow.com/questions/27957766/how-do-i-render-a-word-document-doc-docx-in-the-browser-using-javascript
  function identifyDoc(obj: CreateDocIdentifierArg) {
    const flags = u.isStr(regexStr) ? 'i' : regexStr.flags
    const regex = u.isStr(regexStr)
      ? new RegExp(regexStr, flags)
      : regexStr.value

    if (regexStr === '') {
      _pick(obj, 'subtype.mediaType') === '' ||
        _pick(obj, 'mediaType') === '' ||
        _pick(obj, 'mimeType') === '' ||
        _pick(obj, 'name.type') === ''
    }

    return !!(
      _pick(obj, 'mimeType', '')?.test?.(regex) ||
      _pick(obj, 'name.type', '')?.test?.(regex) ||
      _pick(obj, 'mediaType', '') == mediaType ||
      _pick(obj, 'subtype.mediaType', '') == mediaType
    )
  }
  return identifyDoc
}

export function _getComponentFromCache(
  idOrComp: string | NuiComponent.Instance,
) {
  let id = isComponent(idOrComp) ? idOrComp.id : String(idOrComp)
  return (cache.component.get(id)?.component || null) as NuiComponent.Instance
}

export function _getDescendantIds(component: NuiComponent.Instance): string[] {
  const ids = [] as string[]
  publish(component, (child) => ids.push(child.id))
  return ids
}

export function _getOrCreateComponentPage(
  componentOrNUIPage: NuiComponent.Instance | NUIPage,
  createPage: NDOM['createPage'],
  findPage: NDOM['findPage'],
  node?: any,
) {
  if (_isNUIPage(componentOrNUIPage)) {
    return (findPage(componentOrNUIPage) ||
      // @ts-expect-error
      createPage(componentOrNUIPage, node)) as ComponentPage
  }
  return findPage(componentOrNUIPage) || createPage(componentOrNUIPage, node)
}

/**
 * Returns a random 7-character string
 */
export function _getRandomKey() {
  return `_${Math.random().toString(36).substr(2, 9)}`
}

export function _isNUIPage(value: unknown): value is NUIPage {
  return !!(value && isNuiPage(value) && !isNDOMPage(value))
}

export function _isPluginComponent(component: NuiComponent.Instance) {
  return [
    Identify.component.plugin,
    Identify.component.pluginHead,
    Identify.component.pluginBodyTop,
    Identify.component.pluginBodyTail,
  ].some((fn) => fn(component))
}

export function isCssResourceLink(value = '') {
  return value.endsWith('.css')
}

export function isJsResourceLink(value = '') {
  return value.endsWith('.js')
}

export const isImageDoc = _createDocIdentifier(4, 'image')
export const isMarkdownDoc = _createDocIdentifier(8, 'markdown')
export const isNoteDoc = _createDocIdentifier(1, 'json')
export const isPdfDoc = _createDocIdentifier(1, 'pdf')
export const isTextDoc = (obj: Record<string, any>) => {
  const isTxt = (s: string) => (u.isStr(s) && /text/i.test(s)) || s === ''
  if (u.isFnc(obj?.get)) {
    if (obj?.has?.('ecosObj')) {
      const type = get(obj?.get?.('ecosObj'), 'name.type')
      const mediaType = get(obj?.get?.('ecosObj'), 'subtype.mediaType')
      if (u.isStr(type) && isTxt(type)) return true
      if (u.isNum(mediaType) && mediaType === 8) return true
    }
  }
  // Assume plain objects at this point
  if (isTxt(get(obj, 'name.type'))) return true
  return (
    get(obj, 'subtype.mediaType') == 8 ||
    get(obj, 'blueprint.subtype.mediaType') == 8 ||
    get(obj, 'original.subtype.mediaType') == 8
  )
}
export const isWordDoc = _createDocIdentifier(
  1,
  '(office|wordprocessingml|vnl.)',
)

export function _isElemFactory<N extends HTMLElement>(
  arg: string | ((node: HTMLElement) => node is N),
) {
  const pred = u.isStr(arg) ? (node: HTMLElement) => node.tagName === arg : arg
  return (node: HTMLElement): node is N => {
    return node !== null && typeof node === 'object' && pred(node)
  }
}

export const _isButtonEl = _isElemFactory<HTMLButtonElement>('BUTTON')
export const _isDivEl = _isElemFactory<HTMLDivElement>('DIV')
export const _isImageEl = _isElemFactory<HTMLImageElement>('IMG')
export const _isInputEl = _isElemFactory<HTMLInputElement>('INPUT')
export const _isIframeEl = _isElemFactory<HTMLIFrameElement>('IFRAME')
export const _isLinkEl = _isElemFactory<HTMLLinkElement>('LINK')
export const _isListEl = _isElemFactory<HTMLUListElement>('UL')
export const _isScriptEl = _isElemFactory<HTMLScriptElement>('SCRIPT')
export const _isStyleEl = _isElemFactory<HTMLStyleElement>('STYLE')

export function _isHttpUrl(url = '') {
  return url.startsWith('http')
}

export function _isRemotePageOrUrl(pageOrUrl: string | NDOMPage) {
  const pageName = u.isStr(pageOrUrl) ? pageOrUrl : pageOrUrl?.page || ''
  return pageName.endsWith('.html') || _isHttpUrl(pageName)
}

export const xKeys = ['width', 'left']
export const yKeys = ['height', 'top']
export const posKeys = [...xKeys, ...yKeys]
export const resourceTypes = ['css', 'js'] as const

export function handleDrawGlobalComponent(
  this: NDOM,
  node: HTMLElement,
  component: NuiComponent.Instance,
  page: NDOMPage,
) {
  let globalRecord: GlobalComponentRecord
  let globalId = component.get(c.DATA_GLOBALID)

  const attachOnClick = (n: HTMLElement | null, globalId: string) => {
    if (n) {
      const onClick = () => {
        n.removeEventListener('click', onClick)
        this.removeNode(n)
        // @ts-expect-error
        this.removeGlobalComponent(this.global, globalId)
      }
      n.addEventListener('click', onClick)
    }
  }

  if (this.global.components.has(globalId)) {
    globalRecord = this.global.components.get(globalId) as GlobalComponentRecord
  } else {
    globalRecord = this.createGlobalRecord({
      type: 'component',
      component,
      node,
      page,
    }) as GlobalComponentRecord
    this.global.components.set(globalId, globalRecord)
    attachOnClick(node, globalId)
  }

  if (globalRecord) {
    component.edit({ [c.DATA_GLOBALID]: globalId, globalId })
    if (globalRecord.componentId !== component.id) {
      console.log(
        `%cThe component with id "${component.id || '<Missing ID>'}" ` +
          `is different than the one in the global object.`,
        `color:#CCCD17`,
        globalRecord,
      )
      this.removeComponent(
        cache.component.get(globalRecord.componentId)?.component,
      )
      globalRecord.componentId = component.id
    }

    if (node) {
      !node.id && (node.id = component.id)
      if (globalRecord.nodeId) {
        if (globalRecord.nodeId !== node.id) {
          const _prevNode = document.getElementById(globalRecord.nodeId)
          if (_prevNode) this.removeNode(_prevNode)
          globalRecord.nodeId = node.id
          node.dataset.globalid = globalId
        }
      } else {
        globalRecord.nodeId = node.id
        node.dataset.globalid = globalId
      }
    }

    if (globalRecord.pageId !== page.id) {
      console.log(
        `%cPage ID for global object with id "${component.get(
          c.DATA_GLOBALID,
        )}" does not match with the page that is currently drawing for component "${
          component.id
        }"`,
        `color:#FF5722;`,
        globalRecord,
      )
    }
  }
}

export const _resetActions = u.callAll(
  cache.actions.clear.bind(cache.actions),
  cache.actions.reset.bind(cache.actions),
)

export const _resetComponentCache = cache.component.clear.bind(cache.component)

export const _resetRegisters = cache.register.clear.bind(cache.register)

export const _resetTransactions = cache.transactions.clear.bind(
  cache.transactions,
)

export const _syncPages = (function () {
  const _pageState = new Map<
    number,
    { initiated: boolean; fetching: boolean; initialPageValue: string }
  >()

  const _componentTable = new Map<string, string[]>()
  const _emptyLabel_ = '<empty or loading>'
  const _emptyKey_ = '_EMPTY_'
  const _getKey = (pageName = '') => pageName || _emptyKey_

  cache.component
    .on('add', ({ component, page }) => {
      // console.log(
      //   `[componentTable] Added "${component?.type} component" for page "${
      //     page || _emptyLabel_
      //   }"`,
      // )
      const pageKey = _getKey(page)
      if (!_componentTable.has(pageKey)) _componentTable.set(pageKey, [])
      let ids = _componentTable.get(pageKey) as string[]
      !u.isArr(ids) && (ids = u.array(ids))
      !ids.includes(component.id) && ids.push(component.id)
    })
    .on('remove', ({ id, page }) => {
      // console.log(
      //   `[componentTable] Removed "${id}" from page "${_getKey(page)}"`,
      // )
    })

  function syncPages(this: NDOM) {
    const initSlice = (page: NUIPage) => ({
      fetching: false,
      initiated: false,
      initialPageValue: page.page,
    })

    const removePage = (page: NUIPage) => {
      const id = page.id || ''
      cache.component.clear(page.page)
      cache.page.remove(page)
      const ndomPage = this.findPage(page)
      if (ndomPage && ndomPage.getNuiPage() === page) {
        ndomPage.remove()
        isComponentPage(ndomPage) && ndomPage.clear()
      }
      id in this.global.pages && delete this.global.pages[id]
    }

    const start = <U extends typeof c.PAGE_CREATED | typeof c.PAGE_REMOVED>(
      updateType: U,
    ) => {
      return (
        args: U extends typeof c.PAGE_CREATED
          ? { component?: NuiComponent.Instance; page: NUIPage }
          : NUIPage,
      ) => {
        let page: NUIPage | undefined
        let component: NuiComponent.Instance | undefined
        let label = ''

        if (isNuiPage(args)) {
          page = args
        } else if ('page' in args) {
          component = args.component
          page = args.page
        }

        if (page) {
          label = `[${updateType} #${page.id}]`

          page.use({
            onChange: {
              id: 'syncPages',
              fn: (prev: string, next: string) => {
                console.log(`${label} Page changed from "${prev}" to "${next}"`)
              },
            },
          })

          console.log(label)

          if (updateType === c.PAGE_CREATED) {
            // Incoming page still in the loading state
            // Remove all previous loading pages since we only support 1 loading page right now
            for (const _page of cache.page.get().values()) {
              const nuiPage = _page?.page
              if (
                nuiPage &&
                nuiPage !== page &&
                nuiPage.page === page.page &&
                nuiPage.id !== 'root'
              ) {
                // console.log(`REMOVING PAGE`, { page, _page, nuiPage })
                removePage(nuiPage)
              }
            }

            if (!_pageState.has(page.created)) {
              _pageState.set(page.created, initSlice(page))
            }

            let ndomPage = this.findPage(page)
            let stateSlice = _pageState.get(page.created) || initSlice(page)

            if (!ndomPage) {
              if (component) ndomPage = this.createPage(component)
              else {
                if (page.id) {
                  const pageComponent = this.cache.component?.get?.(
                    page.id as string,
                  )?.component

                  if (pageComponent) {
                    if (pageComponent.get('page') !== page) {
                      pageComponent.edit('page', page)
                    }
                    ndomPage = this.createPage(pageComponent)
                  }
                }

                !ndomPage && (ndomPage = this.createPage(page))
              }
            }

            if (
              // !u.isNil(ndomPage?.id) &&
              // @ts-expect-error
              !this.global.pageIds.includes(ndomPage.id)
            ) {
              this.global.add(ndomPage)
            }

            if (isComponentPage(ndomPage)) {
              stateSlice.initiated = !!ndomPage.initialized
            }

            if (page.page === '') {
              for (const [createTime, stateSlice] of _pageState.entries()) {
                if (stateSlice.initialPageValue === '') {
                  if (createTime < page.created) {
                    // Cleanup previously loading page
                    // This can happen when the user clicks too quickly to several pages
                    // const nuiPage = cache.page
                    //   .get()
                    //   .find(
                    //     (obj) =>
                    //       obj?.page?.created === createTime &&
                    //       obj?.page?.id !== 'root',
                    //   )?.page
                    // nuiPage && removePage(nuiPage)
                  }
                }
              }
            }
          } else if (updateType === c.PAGE_REMOVED) {
            _pageState.delete(page.created)
          }
        }
      }
    }

    cache.page
      .on(c.PAGE_CREATED, start(c.PAGE_CREATED))
      .on(c.PAGE_REMOVED, start(c.PAGE_REMOVED))

    const updateFetching = curry((fetchValue: boolean, page: NUIPage) => {
      if (!page?.created) return null
      if (_pageState.has(page.created)) {
        const stateSlice = _pageState.get(page.created)
        stateSlice && (stateSlice.fetching = fetchValue)
      }
    })

    this.on('onBeforeRequestPageObject', updateFetching(true))
    this.on('onAfterRequestPageObject', updateFetching(false))
  }

  syncPages._pageState = _pageState
  return syncPages
})()
