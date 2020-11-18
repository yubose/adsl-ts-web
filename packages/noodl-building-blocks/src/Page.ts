import { NOODLComponent } from 'noodl-ui'
import * as T from './types'
import * as util from './utils'

class PageBuilder {
  name: string
  module: string
  components: NOODLComponent[]

  actions() {
    const action = util.
  }

  setModule(module: string) {
    this.module = module
    return this
  }

  setName(name: string) {
    this.name = name
    return this
  }

  setComponents(components: NOODLComponent[]) {
    this.components = components
    return this
  }

  build() {
    //
  }

  #createAction = (obj: T.)
}

export default PageBuilder
