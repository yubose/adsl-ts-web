import * as u from '@jsmanifest/utils'
import { ConsumerOptions } from 'noodl-ui'
import { isPage as isNDOMPage } from 'noodl-ui-dom'
import App from '../App'

const createPagePicker = (app: App) => {
  const pickPage = function _pickPage(opts: ConsumerOptions) {
    if (opts?.page) {
      if (
        u.isObj(opts.page) &&
        'object' in opts.page &&
        u.isFnc(opts.page.object)
      ) {
        return app.mainPage
      }
      if (isNDOMPage(opts.page)) return opts.page
    }
    return app.mainPage
  }
  return pickPage
}

export default createPagePicker
