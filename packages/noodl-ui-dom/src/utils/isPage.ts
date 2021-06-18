import NDOMPage from '../Page'

function isPage(value: any): value is NDOMPage {
  return value && typeof value === 'object' && 'getNuiPage' in value
}

export default isPage
