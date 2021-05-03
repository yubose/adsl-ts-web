import { Identify } from 'noodl-types'
import { NUIComponent } from 'noodl-ui'
import { createGlobalComponentId } from './utils/internal'
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
    return createGlobalComponentId(component)
  }
}

export default MiddlewareUtils
