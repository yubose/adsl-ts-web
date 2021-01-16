import { ComponentObject } from 'noodl-types'

export default {
  name: 'getChildren',
  resolve(component: ComponentObject) {
    if (!component) return

    if (component.children) {
      if (Array.isArray(component.children)) {
        component.children = component.children
      }
    }
  },
}
