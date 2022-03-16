/**
 * @DEPRECATED
 * Use the localForage api at src/utils/lf.ts instead
 */
import type { CADL } from '@aitmed/cadl'
import * as u from '@jsmanifest/utils'

const ls = u.isBrowser() ? window.localStorage : ({} as Storage)

const get = (key = '') => {
  let value: any
  try {
    value = ls.getItem(key)
    if (u.isStr(value) && value.trim().startsWith('{')) {
      value = JSON.parse(value)
    }
  } catch (error) {
    console.error(error instanceof Error ? error : new Error(String(error)))
  }
  return value
}
const set = (key = '', value = '') => ls.setItem(key, value)
const clear = () => ls.clear()
const remove = (key = '') => ls.removeItem(key)

const getPk = () => get('pk')
const getSk = () => get('sk')
const getEsk = () => get('esk')
const getUserVid = () => get('user_vid')
const getJwt = () => get('jwt')
const getVcJwt = () => get('vcjwt')
const getGlobal = () => get('Global') as Record<string, any>

/**
 * Returns an object where the keys are the provided keys in arguments and their values were their stored values in local storage. If a value was returned as a JSON string it will be parsed into a JSON object
 * @param { ...string[] } keys
 * @returns { Record<string, any> }
 */
export function getBatchFromLocalStorage<K extends string>(...keys: K[]) {
  return u.isBrowser()
    ? keys.reduce((acc, key) => {
        let value = localStorage.getItem(key)
        let result = value
        if (u.isStr(value)) {
          try {
            result = JSON.parse(value)
          } catch (error) {
            console.error(error)
          }
        }
        if (result != undefined) acc[key] = result
        return acc
      }, {} as Record<K, any>)
    : {}
}

export function getUserProps(type: 'default' | 'admin' = 'default') {
  if (u.isBrowser()) {
    return {
      pk: getPk(),
      sk: getSk(),
      esk: getEsk(),
      user_vid: getUserVid(),
      getJwt: getJwt(),
      ...(type === 'admin' ? { vcjwt: getVcJwt() } : undefined),
    }
  }
}

export function saveUserProps(sdk: CADL) {
  if (!u.isBrowser() || !sdk || !getGlobal()) return
  const globalObj = getGlobal()
  set('jwt', globalObj.currentUser?.JWT)
  set('pk', globalObj.currentUser?.vertex?.pk)
  set('sk', globalObj.currentUser?.vertex?.sk)
  set('esk', globalObj.currentUser?.vertex?.esk)
  set('user_vid', globalObj.currentUser?.vertex?.id)
}

export function getConfig() {
  if (u.isBrowser()) return get('config')
}
