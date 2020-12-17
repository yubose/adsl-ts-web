import { RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] input enter key',
  cond: (node) => !!(node?.tagName === 'INPUT'),
  resolve: (node: HTMLInputElement) => {
    node.onkeypress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const inputs = document.querySelectorAll('input')
        const currentIndex = [...inputs].findIndex((el) => node.isEqualNode(el))
        const targetIndex = (currentIndex + 1) % inputs.length
        if (currentIndex + 1 < inputs.length) inputs[targetIndex]?.focus?.()
      }
    }
  },
} as RegisterOptions
