import { Identify } from 'noodl-types'
import { RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] placeholder',
  cond: (node, component) => component.has?.('placeholder'),
  resolve: (node: HTMLInputElement, component) => {
    const placeholder =
      component.get('data-placeholder') || component.get('placeholder') || ''

    if (Identify.folds.emit(placeholder)) {
      component.on('placeholder', (result) => {
        setTimeout(() => {
          node.placeholder = result
          node.dataset.placeholder = result
        })
      })
    } else {
      node.placeholder = placeholder
      node.dataset.placeholder = placeholder
    }
  },
} as RegisterOptions
