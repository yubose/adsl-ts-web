import { dataAttributes } from '../constants'
import { RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] dataset',
  cond: (node, component) => !!(node && component),
  resolve: (node, component) => {
    if (!node) return

    dataAttributes.forEach((key) => {
      if (component.get?.(key)) {
        node.dataset[key.replace('data-', '')] = component.get?.(key) || ''
        if ('value' in node && key === 'data-value') {
          ;(node as HTMLInputElement).value = component.get?.(key)
        }
      }
    })
  },
} as RegisterOptions
