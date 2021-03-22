import NOODLUIPage from '../Page'

function isPage(value: unknown): value is NOODLUIPage {
  return !!(value && value instanceof NOODLUIPage)
}

export default isPage
