import { dataAttributes } from 'noodl-ui'
import { NOODLDOMElement, RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] dataset',
  cond: (node, component) => !!(node && component),
  resolve: (node: NOODLDOMElement, component) => {
    dataAttributes.forEach((key) => {
      if (component.get(key) != undefined) {
        node.dataset[key.replace('data-', '')] = component.get(key)
      }
    })
  },
} as RegisterOptions
