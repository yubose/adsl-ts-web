import y from 'yaml'
import { ARoot } from '@noodl/core'
import is from './utils/is'
import type { FileSystem } from './utils/fileSystem'
import get from './utils/get'
import unwrap from './utils/unwrap'
import * as c from './constants'

class DocRoot extends ARoot {
  #fs: Partial<FileSystem> | undefined
  value = new Map();

  [Symbol.iterator](): Iterator<[name: string, doc: y.Node | y.Document]> {
    const entries = [...this.value.entries()].reverse()
    return {
      next() {
        return {
          get value() {
            return entries.pop()
          },
          get done() {
            return !entries.length as true
          },
        }
      },
    }
  }

  constructor() {
    super()

    Object.defineProperty(this, '_id_', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: c._symbol.root,
    })
  }

  /**
   * @param key Root key
   * @returns The retrieved value
   */
  get(key: y.Scalar | string | string[]) {
    return get(this.value, key)
  }

  has(key: y.Scalar | string) {
    key = unwrap(key) as string
    return this.value.has(key)
  }

  /**
   * @param key Root key
   * @param value Root value
   */
  set(key: string, value: any) {
    this.value.set(key, value)
    return this
  }

  remove(key: string): this {
    this.value.delete(key)
    return this
  }

  toJSON() {
    return [...this].reduce((acc, [name, doc]) => {
      acc[name] = doc.toJSON()
      return acc
    }, {})
  }

  toString() {
    return JSON.stringify(this.toJSON())
  }

  loadFileSync(
    filepath: string,
    opts?: {
      renameFile?: (filename?: string) => string | void
      renameKey?: (filename: string) => string | void
    },
  ) {
    if (!this.#fs) {
      throw new Error(`Cannot load a file without a fileSystem registered`)
    }

    if (!this.#fs.readFile) {
      throw new Error(
        `Cannot load a file to DocRoot. Missing readFile implementation`,
      )
    }

    if (this.#fs.existsSync) {
      if (!this.#fs.existsSync(filepath)) {
        throw new Error(`The file at path ${filepath} does not exist`)
      }
    }

    const yml = this.#fs.readFile(filepath, 'utf8')

    if (!yml) {
      throw new Error(`The file at ${filepath} yielded empty data`)
    }

    let doc = y.parseDocument(yml)
    let filename = this.#fs.getFileName?.(filepath) || ''
    let key = ''

    if (typeof opts?.renameFile === 'function') {
      const newFileName = opts.renameFile(filename)
      if (typeof newFileName === 'string') filename = newFileName
    }

    if (typeof opts?.renameKey === 'function') {
      const newKey = opts.renameKey(filename)
      if (typeof newKey === 'string') key = newKey
    }

    this.set(key, doc)

    return doc
  }

  use(value: FileSystem) {
    if (is.fileSystem(value)) {
      this.#fs = value
    }
    return this
  }
}

export default DocRoot
