import localForage from 'localforage'

export const lf = localForage.createInstance({
  driver: [localForage.INDEXEDDB, localForage.WEBSQL, localForage.LOCALSTORAGE],
  // driver: [localForage.LOCALSTORAGE],
  storeName: 'noodl',
  description: 'Storage for noodl web apps',
  name: 'noodl',
  size: 1000000000, // 1 gb
  version: 1,
})

export async function clear() {
  await lf.clear()
}

export async function each(
  cb: (key: string, value: unknown, index: number) => Promise<any>,
) {
  await lf.iterate(async (value, key, index) => {
    const result = await cb(key, value, index)
    console.log(`[each] Result`, result)
    return result
  })
}

export function getKeys() {
  return lf.keys()
}

export async function getKeyCount() {
  return (await getKeys()).length
}

export async function getItem(key = '') {
  let value
  await lf.getItem(key).then((res)=>{
    value = res
  })
  return value
}

export async function setItem(key: string, value: any) {
  await lf.setItem(key, value)
}

export function supportsIndexedDB() {
  return localForage.supports(localForage.INDEXEDDB)
}

export function supportsWebSQL() {
  return localForage.supports(localForage.WEBSQL)
}

export default lf
