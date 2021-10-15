import { Page as NUIPage, isPage as isNUIPage } from 'noodl-ui'
import { Page as NDOMPage } from 'noodl-ui-dom'
import App from '../App'

function createPickNDOMPage(app: App) {
  const pickNDOMPage = function _pickNDOMPage(
    page: NUIPage | NDOMPage | undefined,
  ) {
    if (typeof page == 'string' || isNUIPage(page)) {
      return app.ndom.findPage(page)
    }
    return page
  }

  return pickNDOMPage
}

export default createPickNDOMPage
