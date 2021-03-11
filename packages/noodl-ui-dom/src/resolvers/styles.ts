import { NOODLDOMElement, RegisterOptions } from '../types'

function addClassName(className: string, node: NOODLDOMElement) {
  if (!node.classList.contains(className)) {
    node.classList.add(className)
  }
}

export default {
  name: '[noodl-ui-dom] styles',
  cond: (node: NOODLDOMElement, component) =>
    !!(node && component && node?.tagName !== 'SCRIPT'),
  resolve: (node: NOODLDOMElement, component) => {
    const { style } = component
    if (style != null && typeof style === 'object' && node.style) {
      if (component.has('text=func')) {
        // debugger
      }
      Object.entries(style).forEach(([k, v]) => (node.style[k] = v))
      if (component.has('text=func')) {
        // debugger
      }
    }

    // TEMP - Experimenting CSS
    if (component.noodlType === 'scrollView') {
      addClassName('scroll-view', node)
    }

    if (component.has('textBoard')) {
      addClassName('text-board', node)
    }
  },
} as RegisterOptions
