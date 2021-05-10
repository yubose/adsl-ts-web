import { NUIComponent } from 'noodl-ui'
import NOODLDOMPage from './Page'

class MiddlewareUtils {
  static _inst: MiddlewareUtils

  constructor() {
    if (MiddlewareUtils._inst) return MiddlewareUtils._inst
  }
}

export default MiddlewareUtils
