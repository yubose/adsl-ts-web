import { GlobalJsResourceRecord } from '../global/index'

function isJsResourceRecord(value: unknown): value is GlobalJsResourceRecord {
  return (
    typeof value !== null &&
    typeof value === 'object' &&
    (value instanceof GlobalJsResourceRecord ||
      (!!value &&
        'src' in value &&
        value['resourceType'] === 'js' &&
        'toJSON' in value))
  )
}

export default isJsResourceRecord
