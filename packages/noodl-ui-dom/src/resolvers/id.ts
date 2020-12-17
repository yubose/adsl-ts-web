import { RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] id',
  resolve: (node, component) => node && (node.id = component.id || ''),
} as RegisterOptions
