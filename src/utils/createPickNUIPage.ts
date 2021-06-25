import { Page as NUIPage, isPage as isNUIPage } from 'noodl-ui'
import { Page as NDOMPage, isPage as isNDOMPage } from 'noodl-ui-dom'
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
