import { NOODLDOMElement, RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] path (non videos)',
  cond: (n: NOODLDOMElement, c, { original }) =>
    !!original?.path && n?.tagName !== 'VIDEO' && n?.tagName !== 'IFRAME',
  resolve: (node: HTMLImageElement, component) => {
    node && (node.src = component.get('data-src') || '')
  },
} as RegisterOptions
