import NUIPage from '../Page'

function isNUIPage(value: unknown): value is NUIPage {
  return !!(value && typeof value === 'object' && value instanceof NUIPage)
}

export default isNUIPage
