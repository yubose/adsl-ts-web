import { NOODLDOMElement, RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] path (non videos)',
  cond: (n: NOODLDOMElement, c, { original }) =>
    !!original?.path && n?.tagName !== 'VIDEO',
  resolve: (node: HTMLImageElement, component) => {
    node.src = component.get('src') || ''
  },
} as RegisterOptions
