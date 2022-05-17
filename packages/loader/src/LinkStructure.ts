import y from 'yaml'
import path from 'path'
import type { ParsedPath } from 'path'
import * as t from './types'
import * as is from './utils/is'

export interface ILinkStructure
  extends t.IStructure<
    | 'config'
    | 'document'
    | 'image'
    | 'page'
    | 'script'
    | 'text'
    | 'video'
    | 'unknown'
  > {
  ext: string | null
  isRemote: boolean | null
  url: string | null
}

class LinkStructure extends t.AStructure<ILinkStructure> {
  #transform?: (node: any) => any
  configKey = ''
  name = 'link'

  constructor(transform?: (node: any) => any) {
    super()
    if (transform) this.#transform = transform
  }

  is(node: any) {
    if (this.#transform) node = this.#transform(node)
    if (typeof node === 'string') {
      return is.url(node)
    } else if (y.isScalar(node)) {
      return this.is(node.value)
    }
    return false
  }

  createStructure(node: any, group?: string) {
    let raw = node

    if (this.#transform) node = this.#transform(node)

    let url = y.isScalar(node)
      ? String(node.value)
      : typeof node === 'string'
      ? node
      : String(node)

    const parsed = path.parse(url || '')
    const basename = parsed.base

    try {
      url = new URL(url).href
    } catch (error) {
      url = null as any
    }

    let ext = parsed.ext
      ? parsed.ext.replace(/\./g, '')
      : is.file(basename)
      ? basename.substring(basename.lastIndexOf('.') + 1)
      : null

    if (ext) {
      if (['com', 'net', 'org'].includes(ext)) ext = null
      group = group || this.getGroup(parsed)
    } else {
      group = 'unknown'
    }

    return {
      ext,
      group: group as ILinkStructure['group'],
      raw,
      isRemote:
        String(node).startsWith('http') || String(node).startsWith('www'),
      url,
    }
  }

  getGroup(str: ParsedPath | string) {
    const parsed = typeof str === 'object' ? str : path.parse(str)
    if (is.image(parsed.base)) return 'image'
    if (is.script(parsed.base)) return 'script'
    if (is.text(parsed.base)) return 'text'
    if (is.video(parsed.base)) return 'video'
    if (parsed.ext === '') return 'script'
    if (parsed.base.endsWith('.yml')) return 'page'
    return 'unknown'
  }
}

export default LinkStructure
