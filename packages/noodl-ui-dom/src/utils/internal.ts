/**
 * Internal utilities (not exported)
 */
import * as u from '@jsmanifest/utils'
import get from 'lodash/get'
import { ComponentObject, EcosDocument, NameField } from 'noodl-types'
import { NUIComponent } from 'noodl-ui'
import GlobalComponentRecord from '../global/GlobalComponentRecord'
import { cache, nui } from '../nui'
import NDOM from '../noodl-ui-dom'
import NDOMPage from '../Page'
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
        _removeNode(n)
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
          if (_prevNode) {
            _removeNode(_prevNode)
          }
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
export function _removePage(page: NDOMPage | undefined | null) {
  if (page) {
    nui.clean(page.getNuiPage(), console.log)
    page.remove()
    // if (page.id in this.global.pages) delete this.global.pages[page.id]
    page = null
  }
}
