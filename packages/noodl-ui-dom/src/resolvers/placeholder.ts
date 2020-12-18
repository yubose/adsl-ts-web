import { RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] placeholder',
  cond: (node, component) =>
    !!(node && component.get('placeholder') != undefined),
  resolve: (node: HTMLInputElement, component) =>
    node && (node.placeholder = component.get('placeholder') || ''),
} as RegisterOptions
