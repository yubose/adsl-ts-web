const localForage = require('localforage')

const lf = localForage.createInstance({
  driver: [localForage.INDEXEDDB, localForage.WEBSQL, localForage.LOCALSTORAGE],
  storeName: 'noodl_test_pi',
  description: 'Storage for noodl web apps',
  name: 'noodl',
  size: 1000000000, // 1 gb
})

async function clear() {
  await lf.clear()
}

/**
 *
 * @param { (key: string, value: unknown, index: number) => Promise<any> } cb
 */
async function each(cb) {
  await lf.iterate(async (value, key, index) => {
    const result = await cb(key, value, index)
    console.log(`[each] Result`, result)
    return result
  })
}

function getKeys() {
  return lf.keys()
}

async function getKeyCount() {
  return (await getKeys()).length
}

async function getItem(key = '') {
  return lf.getItem(key)
}

async function setItem(key, value) {
  await lf.setItem(key, value)
}

function supportsIndexedDB() {
  return localForage.supports(localForage.INDEXEDDB)
}

function supportsWebSQL() {
  return localForage.supports(localForage.WEBSQL)
}

exports.lf = lf
exports.clear = clear
exports.each = each
exports.getKeys = getKeys
exports.getKeyCount = getKeyCount
exports.getItem = getItem
exports.setItem = setItem
exports.supportsIndexedDB = supportsIndexedDB
exports.supportsWebSQL = supportsWebSQL
