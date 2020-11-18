import { Action, NOODLComponent } from 'noodl-ui'
import * as T from './types'
import * as util from './utils'

class PageBuilder {
  actions: T.IBaseAction<any>[]
  name: string
  module: string
  components: NOODLComponent[]

  action<
    ActionType extends string,
    ActionObj extends T.IBaseAction<ActionType>
  >(obj: ActionObj) {
    const action = this.#createAction(obj)
  }

  #createAction = <ActionObj>(obj: ActionObj) => {
    this.actions.push()
    return obj
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
}

export default PageBuilder
