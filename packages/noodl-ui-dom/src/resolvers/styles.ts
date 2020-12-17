import { RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] styles',
  resolve: (node, component) => {
    if (node && node.tagName !== 'SCRIPT') {
      const { style } = component
      if (style != null && typeof style === 'object') {
        Object.entries(style).forEach((k: any, v: any) => (style[k] = v))
      }
    }
  },
} as RegisterOptions
