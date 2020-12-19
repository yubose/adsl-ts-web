import { NOODLDOMElement, RegisterOptions } from '../types'

function isDisplayable(value: unknown): value is string | number {
  return value == 0 || typeof value === 'string' || typeof value === 'number'
}
export default {
  name: '[noodl-ui-dom] common',
  resolve(node: NOODLDOMElement, component) {
    if (!node.innerHTML.trim()) {
      const text = component.get('text')
      if (isDisplayable(component.get('data-value'))) {
        node.innerHTML = `${component.get('data-value')}`
      } else if (isDisplayable(text)) {
        node.innerHTML = `${text}`
      }
    }
  },
} as RegisterOptions
