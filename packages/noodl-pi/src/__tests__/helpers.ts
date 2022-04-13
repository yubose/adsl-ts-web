import type IDB from 'idb'
import sinon from 'sinon'
import * as u from '../utils'
import * as c from '../constants'
import * as t from '../types'

export function createMockDb({
  initialValue,
  ...options
}: Partial<IDB.IDBPDatabase> & { initialValue?: any } = {}) {
  const cache = { ...initialValue } as Record<string, Record<string, any>>
  const db = {
    cache,
    addEventListener: () => {},
    put: async (storeName, value, key) =>
      void (cache[storeName][key as any] = value),
    add: async (storeName, value, key) =>
      void (cache[storeName][key as any] = value),
    clear: async (storeName) =>
      void Object.keys(cache[storeName]).forEach(
        (key) => delete cache[storeName][key],
      ),
    createObjectStore: (storeName, opts) => (cache[storeName] = { ...opts }),
    get: async (storeName, key) => cache[storeName][key as any],
    objectStoreNames: {
      contains(storeName) {
        return Object.keys(cache).includes(storeName)
      },
      get length() {
        return Object.keys(cache).length
      },
    },
    transaction(storeName) {
      return {
        store: {
          count: () => Object.keys(cache[storeName] || {}).length,
          getAllKeys: () => Object.keys(cache),
        },
      }
    },
    delete: async (storeName, key) => delete cache[storeName][key as any],
    ...options,
  } as IDB.IDBPDatabase
  return db as typeof db & { cache: typeof cache }
}

export function mockFetchResponse(responseBody: any) {
  const fetcher = sinon.spy(async () => ({
    json: async () => responseBody,
  }))
  Object.defineProperty(global.self, 'fetch', {
    value: fetcher,
  })
  return fetcher
}
