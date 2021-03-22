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
  resolve: (node: HTMLElement, component) => {
    const originalStyle = component.original?.style || {}
    const { style } = component
    if (style != null && typeof style === 'object' && node.style) {
      if (component.has('text=func')) {
        // debugger
      }
      Object.entries(style).forEach(([k, v]) => {
        // if (k === 'height' && v === 'auto') {
        //   node.style.cssText += `height: inherit !important;`
        // } else {
        node.style[k] = v
        // }
      })
      if (component.has('text=func')) {
        // debugger
      }
    }

    // TEMP - Experimenting CSS
    if (component.original?.axis === 'vertical') {
      addClassName('axis-vertical', node)
    }

    if (component.noodlType === 'scrollView') {
      addClassName('scroll-view', node)
    }

    if (component.has('textBoard')) {
      addClassName('text-board', node)
    }

    if (!originalStyle?.top || originalStyle?.top === 'auto') {
      node.style.position = 'relative'
    } else {
      node.style.position = 'absolute'
    }
  },
} as RegisterOptions
