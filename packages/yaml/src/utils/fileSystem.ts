import type { ParsedPath } from 'path'
import { _symbol } from '../constants'

export type FileSystem = ReturnType<typeof createFileSystem>

export interface IFileSystem {
  existsSync: (filepath: string) => boolean
  getBaseName: (str: string) => string
  parseFilePath: (str: string) => ParsedPath
  readFile?: (filepath: string, encoding?: string) => string
  writeFile?: (filepath: string, data: any) => void
  readJson?: (filepath: string) => any
  writeJson?: (filepath: string) => void
  readdir?: (dir: string) => string[]
}

function createFileSystem(this: any, bindings: IFileSystem) {
  let existsSync = bindings?.existsSync
  let readFile = bindings?.readFile
  let writeFile = bindings?.writeFile
  let readJson = bindings?.readJson
  let writeJson = bindings?.writeJson
  let readdir = bindings?.readdir
  let parseFilePath = bindings?.parseFilePath

  function getFileName(filepath: string) {
    if (!parseFilePath) {
      filepath = filepath.includes('/')
        ? filepath.substring(filepath.lastIndexOf('/') + 1)
        : filepath
    } else {
      const parsed = parseFilePath(filepath)
      filepath = parsed.base
    }
    return filepath
  }

  const o = {
    existsSync,
    getFileName,
    readFile,
    writeFile,
    readJson,
    writeJson,
    readdir,
  }

  Object.defineProperty(o, '_id_', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: _symbol.fs,
  })

  return o
}

export default createFileSystem
