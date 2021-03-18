import { RegisterOptions } from '../../types'

export default {
  name: '[noodl-ui-dom] label',
  cond: 'label',
  resolve(node: HTMLLabelElement, component) {
    const dataValue = component.get('data-value') || ''
    const { placeholder, text } = component.props()
    if (dataValue) node.innerHTML = dataValue
    else if (text) node.innerHTML = text
    else if (placeholder) node.innerHTML = placeholder
    if (typeof component.get('onClick') === 'function') {
      node.style['cursor'] = 'pointer'
    }
  },
} as RegisterOptions
