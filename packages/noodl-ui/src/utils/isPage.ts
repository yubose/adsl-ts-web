import NUIPage from '../Page'

function isPage(value: unknown): value is NUIPage {
  return !!(value && value instanceof NUIPage)
}

export default isPage
