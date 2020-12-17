import { RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] placeholder',
  cond: (node, component) =>
    !!(node && 'placeholder' in node && !component.get('placeholder')),
  resolve: (node: HTMLInputElement, component) =>
    node && (node.placeholder = component.get('placeholder') || ''),
} as RegisterOptions
