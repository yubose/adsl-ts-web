import { Page as NUIPage, NDOMPage, isNDOMPage } from 'noodl-ui'
import App from '../App'

function createPickNUIPage(app: App) {
  const pickNUIPage = function _pickNDOMPage(
    page: NUIPage | NDOMPage | undefined,
  ) {
    if (isNDOMPage(page)) return page.getNuiPage()
    return page
  }

  return pickNUIPage
}

export default createPickNUIPage
