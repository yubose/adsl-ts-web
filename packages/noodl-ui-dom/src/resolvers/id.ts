import { NOODLDOMElement, RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] id',
  cond: (node, component) => !!(node && component),
  resolve: (node: NOODLDOMElement, component) =>
    node && (node.id = component.id || ''),
} as RegisterOptions
