import { Action, NOODL, NOODLComponent, Viewport } from 'noodl-ui'
import * as T from './types'
import * as util from './utils'

class PageBuilder {
  actions: { [actionType: string]: T.IBaseAction<any>[] }
  builtIns: { [funcName: string]: T.IBuiltInAction[] }
  assetsUrl: string
  components: NOODLComponent[]
  module: string
  name: string
  noodlui: NOODL

  viewport: Viewport

  constructor() {
    this.viewport = new Viewport()
    this.noodlui = new NOODL({ viewport: this.viewport })
  }

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

  setAssetsUrl(assetsUrl: string) {
    this.assetsUrl = assetsUrl
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
    this.noodlui
      .setAssetsUrl(this.assetsUrl)
      .setPage(this.name)
      .setViewport(this.viewport)
  }
}

export default PageBuilder
