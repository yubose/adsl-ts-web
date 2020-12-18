import { RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] styles',
  cond: (node, component) =>
    !!(node && component && node?.tagName !== 'SCRIPT'),
  resolve: (node, component) => {
    const { style } = component
    if (style != null && typeof style === 'object') {
      Object.entries(style).forEach(([k, v]) => (node.style[k] = v))
    }
  },
} as RegisterOptions
