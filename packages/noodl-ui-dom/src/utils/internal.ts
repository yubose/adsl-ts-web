/**
 * Internal utilities (not exported)
 */
import * as u from '@jsmanifest/utils'
import flowRight from 'lodash/flowRight'
import get from 'lodash/get'
import { ComponentObject, EcosDocument, Identify, NameField } from 'noodl-types'
import { isPage as isNUIPage, publish } from 'noodl-ui'
import type { NUIComponent, Page as NUIPage } from 'noodl-ui'
import type { ComponentPage } from '../factory/componentFactory'
import type GlobalComponentRecord from '../global/GlobalComponentRecord'
import type NDOM from '../noodl-ui-dom'
import type NDOMPage from '../Page'
import isComponentPage from './isComponentPage'
import { cache, nui } from '../nui'
import * as c from '../constants'
import * as t from '../types'

export function addClassName(className: string, node: HTMLElement) {
  if (!node.classList.contains(className)) {
    node.classList.add(className)
  }
}

type CreateDocIdentifierArg =
  | NUIComponent.Instance
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
   * @param { NUIComponent | ComponentObject | NUIAction | NUIActionObjectInput } obj
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

export function _getDescendantIds(component: NUIComponent.Instance): string[] {
  const ids = [] as string[]
  publish(component, (child) => ids.push(child.id))
  return ids
}

export function _getOrCreateComponentPage(
  componentOrNUIPage: NUIComponent.Instance | NUIPage,
  createPage: NDOM['createPage'],
  findPage: NDOM['findPage'],
) {
  if (isNUIPage(componentOrNUIPage)) {
    return (findPage(componentOrNUIPage) ||
      createPage(componentOrNUIPage)) as ComponentPage
  }
  return findPage(componentOrNUIPage) || createPage(componentOrNUIPage)
}

/**
 * Returns a random 7-character string
 */
export function _getRandomKey() {
  return `_${Math.random().toString(36).substr(2, 9)}`
}

export function _isPluginComponent(component: NUIComponent.Instance) {
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
  return pageName.endsWith('.html')
}

export const xKeys = ['width', 'left']
export const yKeys = ['height', 'top']
export const posKeys = [...xKeys, ...yKeys]
export const resourceTypes = ['css', 'js'] as const

export function handleDrawGlobalComponent(
  this: NDOM,
  node: HTMLElement,
  component: NUIComponent.Instance,
  page: NDOMPage,
) {
  let globalRecord: GlobalComponentRecord
  let globalId = component.get(c.DATA_GLOBALID)

  const attachOnClick = (n: HTMLElement | null, globalId: string) => {
    if (n) {
      const onClick = () => {
        n.removeEventListener('click', onClick)
        _removeNode.call(this, n)
        _removeGlobalComponent.call(this, this.global, globalId)
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
      _removeComponent.call(
        this,
        this.cache.component.get(globalRecord.componentId)?.component,
      )
      globalRecord.componentId = component.id
    }

    if (node) {
      !node.id && (node.id = component.id)
      if (globalRecord.nodeId) {
        if (globalRecord.nodeId !== node.id) {
          const _prevNode = document.getElementById(globalRecord.nodeId)
          if (_prevNode) _removeNode(_prevNode)
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

/**
 * Removes the component from the {@link ComponentCache} and all parent/child
 * references
 */
export function _removeComponent(
  this: NDOM,
  component: NUIComponent.Instance | undefined | null,
) {
  if (!component) return
  const remove = (_c: NUIComponent.Instance) => {
    cache.component.remove(_c)
    if (_c.has?.('global') || _c.blueprint?.global) {
      _removeGlobalComponent.call(this, _c.get(c.DATA_GLOBALID))
    }
    _c?.setParent?.(null)
    _c?.parent?.removeChild(_c)
    _c.children?.forEach?.((_c) => remove(_c))
    if (_c.has('page')) _c.remove('page')
    _c.clear?.()
  }
  remove(component)
}

export function _removeGlobalComponent(
  this: NDOM,
  globalMap: t.GlobalMap,
  globalId = '',
) {
  if (globalId) {
    if (globalMap.components.has(globalId)) {
      const globalComponentObj = globalMap.components.get(globalId)
      const obj = globalComponentObj?.toJSON()
      if (obj) {
        const { componentId, nodeId } = obj
        if (componentId) {
          if (cache.component.has(componentId)) {
            _removeComponent.call(
              this,
              cache.component.get(componentId)?.component,
            )
          }
        }
        this.global.components.delete(globalId)
        if (nodeId) {
          const node = document.querySelector(
            `[data-key="${globalId}"]`,
          ) as HTMLElement
          node && _removeNode(node)
        }
      }
    }
  }
}

/**
 * Removes the node from the DOM by parent/child references
 */
export function _removeNode(node: t.NDOMElement) {
  if (node) {
    try {
      node.parentNode?.removeChild?.(node)
      node.remove?.()
    } catch (error) {
      console.error(error)
    }
  }
}

/**
 * Removes the NDOMPage from the {@link GlobalMap}
 */
export function _removePage(
  this: NDOM | undefined,
  page: NDOMPage | undefined | null,
) {
  if (page) {
    const id = page.id
    nui.clean(page.getNuiPage(), console.info)
    page.remove()
    if (this?.global?.pages) {
      if (id in this.global.pages) delete this.global.pages[id]
    }
    try {
      if (isComponentPage(page)) {
        page.clear()
      } else {
        page.remove()
        page?.rootNode?.remove?.()
      }
    } catch (error) {
      console.error(error)
    }
    page = null
  }
}

export function _syncPages(this: NDOM) {
  const _state = new Map<
    number,
    { initiated: boolean; fetching: boolean; initialPageValue: string }
  >()

  const initSlice = (page: NUIPage) => ({
    fetching: false,
    initiated: false,
    initialPageValue: page.page,
  })

  const removePage = (page: NUIPage) => {
    const id = page.id || ''
    this.cache.component.clear(page.page)
    this.cache.page.remove(page)
    const ndomPage = this.findPage(page)
    if (ndomPage && ndomPage.getNuiPage() === page) {
      ndomPage.remove()
      isComponentPage(ndomPage) && ndomPage.clear()
    }
    id in this.global.pages && delete this.global.pages[id]
  }

  const start = (updateType: 'PAGE_CREATED' | 'PAGE_REMOVED') => {
    return (page: NUIPage) => {
      if (updateType === 'PAGE_CREATED') {
        if (!_state.has(page.created)) {
          _state.set(page.created, initSlice(page))
        }

        let ndomPage = this.findPage(page)
        let pageRequesting = ndomPage?.requesting
        let stateSlice = _state.get(page.created) || initSlice(page)

        if (!ndomPage) {
          ndomPage = this.createPage(page)
          pageRequesting = ndomPage.requesting
        }

        console.info(
          `[PAGE_CREATED] ${(pageRequesting || page.page || '') && ' '}${
            page.id
          }`,
        )

        !this.global.pageIds.includes(ndomPage.id) && this.global.add(ndomPage)

        if (ndomPage.getNuiPage() === page) {
          //
        } else {
          //
        }

        if (isComponentPage(ndomPage)) {
          stateSlice.initiated = !!ndomPage.initialized
        }

        if (page.page === '') {
          for (const [createTime, stateSlice] of _state.entries()) {
            if (stateSlice.initialPageValue === '') {
              if (stateSlice.fetching) {
                if (page.created !== createTime) {
                  // Cleanup previously loading page
                  // This can happen when the user clicks too quickly to several pages
                  const nuiPage = this.cache.page
                    .get()
                    .find((obj) => obj?.page?.created === createTime)?.page

                  if (nuiPage && nuiPage.id !== 'root') {
                    removePage(nuiPage)
                  }
                }
              } else {
                //
              }

              if (!stateSlice.initiated && createTime < page.created) {
                const prevNDOMPage = u
                  .values(this.global.pages)
                  .find((p) => p.created === createTime)

                if (prevNDOMPage) {
                  // removePage(prevNDOMPage.getNuiPage())
                }
              }
            }
          }
        }
      } else if (updateType === 'PAGE_REMOVED') {
        console.info(`[PAGE_REMOVED] ${page.page || ''} ${page.id}`)

        const isRemoved = _state.delete(page.created)
        if (isRemoved) {
          //
        }
      }
    }
  }

  // prettier-ignore
  this.cache.page
      .on('PAGE_CREATED', start('PAGE_CREATED'))
      .on('PAGE_REMOVED', start('PAGE_REMOVED'))

  this.on('onBeforeRequestPageObject', (page) => {
    if (_state.has(page.created)) {
      const stateSlice = _state.get(page.created)
      stateSlice && (stateSlice.fetching = true)
    }
  })

  this.on('onAfterRequestPageObject', (page) => {
    if (_state.has(page.created)) {
      const stateSlice = _state.get(page.created)
      stateSlice && (stateSlice.fetching = false)
    }
  })

  return function unsubscribe(this: NDOM) {
    u.values(this.hooks).forEach((arr) => (arr.length = 0))
  }.bind(this)
}
