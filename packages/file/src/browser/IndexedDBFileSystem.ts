import type { LiteralUnion } from 'type-fest'
import { createFs } from 'indexeddb-fs'

export interface CreateIndexedDBFileSystemOptions {
  /**
   * Default: 'noodl-db'
   */
  databaseName?: string
  /**
   * Default: 1
   */
  dbVersion?: number
  /**
   * Default: 'root'
   */
  rootDirName?: LiteralUnion<'root', string>
  /**
   * Default: 'noodl-file'
   */
  storeName?: string
}

export function createIndexedDBFileSystem(
  opts?: CreateIndexedDBFileSystemOptions,
) {
  const idbfs = createFs({
    databaseName: opts?.databaseName ?? 'noodl-db',
    databaseVersion: opts?.dbVersion ?? 1,
    objectStoreName: opts?.storeName ?? 'noodl-file',
    rootDirectoryName: opts?.rootDirName ?? 'root',
  })

  const fs = {
    copyFile: idbfs.copyFile,
    ensureDir: async (p: string) => void (await idbfs.createDirectory(p)),
    exists: idbfs.exists,
    isFile: idbfs.isFile,
    isDir: idbfs.isDirectory,
    moveFile: async (p1: string, p2: string) =>
      void (await idbfs.moveFile(p1, p2)),
    readFile: idbfs.readFile,
    readdir: async (p: string) =>
      (await idbfs.readDirectory(p)).files.map((o) => o.fullPath),
    removeFile: async (p: string) => void (await idbfs.remove(p)),
    writeFile: async (p: string, data: any) =>
      void (await idbfs.writeFile(p, data)),
  }

  return fs
}
