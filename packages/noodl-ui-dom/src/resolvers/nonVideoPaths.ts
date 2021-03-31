import { RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] path (non videos)',
  cond: (n, c) =>
    !!(
      n &&
      c &&
      c.has('path') &&
      n.tagName !== 'VIDEO' &&
      n.tagName !== 'IFRAME'
    ),
  resolve: (node: HTMLImageElement, component) => {
    if (component.get('data-src')) node.dataset.src = component.get('data-src')
    node.src = component.get('data-src')
    component.on('path', (result) => {
      node.src = result
      node.dataset.src = result
    })
  },
} as RegisterOptions
