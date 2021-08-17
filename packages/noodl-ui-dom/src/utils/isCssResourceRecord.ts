import { GlobalCssResourceRecord } from '../global/index'

function isCssResourceRecord(value: unknown): value is GlobalCssResourceRecord {
  return (
    typeof value !== null &&
    typeof value === 'object' &&
    (value instanceof GlobalCssResourceRecord ||
      (!!value &&
        'href' in value &&
        value['resourceType'] === 'css' &&
        'toJSON' in value))
  )
}

export default isCssResourceRecord
