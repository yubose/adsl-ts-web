import type IDB from 'idb'
import * as u from '@jsmanifest/utils'
import * as c from '../constants'
import * as t from '../types'

export function createMockDb(options?: Partial<IDB.IDBPDatabase>) {
  const cache = { version: {} } as Record<string, Record<string, any>>
  const db = {
    cache,
    put: async (storeName, value, key) =>
      void (cache[storeName][key as any] = value),
    add: async (storeName, value, key) =>
      void (cache[storeName][key as any] = value),
    clear: async (storeName) =>
      void u
        .keys(cache[storeName])
        .forEach((key) => delete cache[storeName][key]),
    createObjectStore: (storeName, opts) => (cache[storeName] = { ...opts }),
    get: async (storeName, key) => cache[storeName][key as any],
    objectStoreNames: {
      contains(storeName) {
        return u.keys(cache).includes(storeName)
      },
      get length() {
        return u.keys(cache).length
      },
    },
    transaction(storeName) {
      return {
        store: {
          count: () => u.keys(cache[storeName] || {}).length,
        },
      }
    },
    delete: async (storeName, key) => delete cache[storeName][key as any],
    ...options,
  } as IDB.IDBPDatabase
  return db
}
