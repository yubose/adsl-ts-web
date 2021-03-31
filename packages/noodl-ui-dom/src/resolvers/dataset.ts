import { dataAttributes } from '../constants'
import { RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] dataset',
  cond: (node, component) => !!(node && component),
  resolve: (node, component) => {
    dataAttributes.forEach((key) => {
      if (component.get(key) != undefined) {
        node.dataset[key.replace('data-', '')] = component.get(key)
      }
    })
  },
} as RegisterOptions
