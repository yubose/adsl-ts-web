import { parse as parseYml } from 'yaml'
import * as nt from 'noodl-types'
import * as u from '@jsmanifest/utils'
import { command as cmd } from '../../constants'

export function getFromCache(
  store: IDBObjectStore,
  key: string,
): Promise<{ result: any; event: Event }> {
  return new Promise((resolve, reject) => {
    const req = store.get(key)

    req.addEventListener(
      'success',
      (event) => resolve({ result: req.result, event }),
      { once: true },
    )

    req.addEventListener('error', (err) => reject(err), { once: true })
  })
}

export async function getOrFetch<O = any>(
  store: IDBObjectStore,
  key = '',
  {
    type = 'text',
  }: {
    type?: 'blob' | 'json' | 'text'
  } = {},
): Promise<{ result: any; event?: Event }> {
  try {
    if (key.startsWith('http')) {
      const resp = await fetch(key)
      const result = await resp[type]?.()
      return { result }
    } else {
      const results = await getFromCache(store, key)
      return results
    }
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error(String(error))
  }
}
