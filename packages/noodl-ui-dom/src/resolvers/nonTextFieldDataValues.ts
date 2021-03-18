import { NOODLDOMElement, RegisterOptions } from '../types'
import { isTextFieldLike } from '../utils/utils'

export default {
  name: '[noodl-ui-dom] data values in non-textfield-like components',
  cond: (node, component) =>
    !!node &&
    !isTextFieldLike(node) &&
    (component.get('text') ||
      component.get('placeholder') ||
      component.get('data-value')),
  resolve: (node: NOODLDOMElement, component) => {
    let dataValue = component.get('data-value')
    let placeholder = component.get('placeholder')
    let text = component.get('text')
    text = typeof dataValue === 'string' ? dataValue : text || text || ''
    // if (!text && children) text = `${children}` || ''
    if (!text && placeholder) text = placeholder
    if (!text) text = ''
    if (text && node) node.innerHTML = `${text}`
  },
} as RegisterOptions
