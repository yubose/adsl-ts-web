import { RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] text=func',
  cond: (n, c) => typeof c.get('text=func') === 'function',
  resolve: (node, c) => node && (node.innerHTML = c.get('data-value') || ''),
} as RegisterOptions
