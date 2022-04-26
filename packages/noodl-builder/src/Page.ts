import type { ComponentObject, PageObject } from 'noodl-types'
import NoodlObject from './Object'

class Page extends NoodlObject {
  components: undefined | ComponentObject[]
  init: undefined | any[]

  create(name: string) {
    const pageObject = super.createProperty(name, {})
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
