import { NOODLDOMElement, RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] styles',
  cond: (node: NOODLDOMElement, component) =>
    !!(node && component && node?.tagName !== 'SCRIPT'),
  resolve: (node: NOODLDOMElement, component) => {
    const { style } = component
    if (style != null && typeof style === 'object' && node.style) {
      Object.entries(style).forEach(([k, v]) => (node.style[k] = v))
    }
  },
} as RegisterOptions
