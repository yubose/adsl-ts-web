import type { ComponentObject, PageObject } from 'noodl-types'
import NoodlObject from './Object'

class Page extends NoodlObject<PageObject> {
  components: undefined | ComponentObject[]
  init: undefined | any[]

  create(name: string) {
    const pageObject = super.create(name, {})
    return pageObject
  }

  createInit() {
    this.init = []
    return this.init
  }

  createComponents() {
    this.components = []
    return this.components
  }
}

export default Page
