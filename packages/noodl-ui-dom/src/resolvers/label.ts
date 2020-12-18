import { RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] label',
  cond: (node, c) => !!(node && c?.noodlType === 'label'),
  resolve(node, component) {
    const dataValue = component.get('data-value')
    const { placeholder, text } = component.get(['placeholder', 'text'])
    if (dataValue) node.innerHTML = dataValue
    else if (text) node.innerHTML = text
    else if (placeholder) node.innerHTML = placeholder
    if (typeof component.get('onClick') === 'function') {
      node.style['cursor'] = 'pointer'
    }
  },
} as RegisterOptions
