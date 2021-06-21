import NUIPage from '../Page'

function isNUIPage(value: unknown): value is NUIPage {
  return !!(
    value &&
    typeof value === 'object' &&
    'object' in value &&
    typeof value['object'] === 'function'
  )
}

export default isNUIPage
