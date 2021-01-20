import { NOODLDOMElement, RegisterOptions } from '../types'
import { isTextFieldLike } from '../utils'

export default {
  name: '[noodl-ui-dom] data values in non-textfield-like components',
  cond: (node, component) =>
    !!node &&
    !isTextFieldLike(node) &&
    (component.get('text') ||
      component.get('placeholder') ||
      component.get('data-value')),
  resolve: (node: NOODLDOMElement, component) => {
    const dataValue = component.get('data-value')
    let { placeholder, text } = component.get(['placeholder', 'text'])
    text = typeof dataValue === 'string' ? dataValue : text || text || ''
    // if (!text && children) text = `${children}` || ''
    if (!text && placeholder) text = placeholder
    if (!text) text = ''
    if (text && node) node.innerHTML = `${text}`
  },
} as RegisterOptions
