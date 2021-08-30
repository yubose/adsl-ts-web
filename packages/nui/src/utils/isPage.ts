import NuiPage from '../Page'

function isNuiPage(value: unknown): value is NuiPage {
  return !!(
    value &&
    typeof value === 'object' &&
    Object.prototype.hasOwnProperty.call(value, 'created')
  )
}

export default isNuiPage
