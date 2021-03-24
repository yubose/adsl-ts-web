import { Identify } from 'noodl-types'
import { NUIComponent } from 'noodl-ui'
import NOODLDOMPage from './Page'

class MiddlewareUtils {
  static _inst: MiddlewareUtils

  constructor() {
    if (MiddlewareUtils._inst) return MiddlewareUtils._inst
  }

  createGlobalComponentId(
    page: NOODLDOMPage,
    component: NUIComponent.Instance,
  ) {
    let s = Identify.component.popUp(component)
      ? component.get('popUpView')
      : ''
    let globalId = `${page.page}:${s}`
    return globalId
  }
}

export default MiddlewareUtils
