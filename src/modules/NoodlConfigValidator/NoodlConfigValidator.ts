import * as u from '@jsmanifest/utils'

export interface ConfigValidatorOptions {
  configKey: string
  timestampKey: string
  get?: (key: string) => any
  set?: (key: string, value?: any) => void
}

function createNoodlConfigValidator({
  configKey = '',
  timestampKey = '',
  get = () => {},
  set = () => {},
}: ConfigValidatorOptions) {
  const _cacheTimestamp = () => set(_getTimestampKey(), _getCurrentTimestamp())
  const _configExists = () => !!get(configKey)
  const _getConfigObject = () => _getStoredConfigObject()
  const _getStoredTimestamp = () => get(_getTimestampKey())
  const _getCurrentTimestamp = () => _getConfigObject()?.[timestampKey] || ''
  const _isTimestampEq = () => _getStoredTimestamp() == _getCurrentTimestamp()

  function _getStoredConfigObject() {
    try {
      let cfg = get(configKey)
      if (u.isStr(cfg)) return JSON.parse(cfg)
      return cfg
    } catch (error) {
      console.error(error)
    }
  }

  function _getTimestampKey() {
    const cfg = _getConfigObject()
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
