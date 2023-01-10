import * as u from '@jsmanifest/utils'
import log from '../../log'

export interface ConfigValidatorOptions {
  configKey: string
  timestampKey: string
  get?: (key: string) => Promise<any>
  set?: (key: string, value: any) => Promise<void>
}

function createNoodlConfigValidator({
  configKey = '',
  timestampKey = '',
  get = async () => {},
  set = async () => {},
}: ConfigValidatorOptions) {
  const _cacheTimestamp = async () =>
    set(await _getTimestampKey(), await _getCurrentTimestamp())
  const _configExists = async () => !!(await get(configKey))
  const _getStoredTimestamp = async () => get(await _getTimestampKey())
  const _getCurrentTimestamp = async () =>
    (await _getStoredConfigObject())?.[timestampKey] || ''
  const _isTimestampEq = async () =>
    (await _getStoredTimestamp()) == (await _getCurrentTimestamp())

  async function _getStoredConfigObject() {
    try {
      let cfg = await get(configKey)
      if (u.isStr(cfg)) return JSON.parse(cfg)
      return cfg
    } catch (error) {
      log.error(error)
    }
  }

  async function _getTimestampKey() {
    const cfg = await _getStoredConfigObject()
    if (u.isObj(cfg) && timestampKey in cfg) return String(cfg[timestampKey])
    return ''
  }

  return {
    cacheTimestamp: _cacheTimestamp,
    configExists: _configExists,
    getCurrentTimestamp: _getCurrentTimestamp,
    getStoredTimestamp: _getStoredTimestamp,
    getStoredConfigObject: _getStoredConfigObject,
    getTimestampKey: _getTimestampKey,
    isTimestampEq: _isTimestampEq,
  }
}

export default createNoodlConfigValidator
