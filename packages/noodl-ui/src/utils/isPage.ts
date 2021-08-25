import NUIPage from '../Page'

function isNUIPage(value: unknown): value is NUIPage {
  return !!(
    value &&
    typeof value === 'object' &&
    Object.prototype.hasOwnProperty.call(value, 'created')
  )
}

export default isNUIPage
