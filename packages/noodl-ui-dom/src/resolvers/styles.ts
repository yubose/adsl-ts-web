import { Identify } from 'noodl-types'
import { Viewport as VP } from 'noodl-ui'
import { NOODLDOMElement, RegisterOptions } from '../types'
import { addClassName, entries, isObj } from '../utils/internal'

export default {
  name: '[noodl-dom] Styles',
  cond: (node, component) =>
    !!(node && component && node?.tagName !== 'SCRIPT'),
  resolve: (node: HTMLElement, component) => {
    if (isObj(component.style?.textAlign)) {
      delete component.style.textAlign
    }

    entries(component.style).forEach(([styleKey, styleValue]) => {
      node.style[styleKey] = String(styleValue)
    })

    if (VP.isNil(component.blueprint?.style?.marginTop)) {
      component.style.marginTop = '0px'
    }

    /* -------------------------------------------------------
      ---- TEMP - Experimenting CSS
    -------------------------------------------------------- */

    if (Identify.component.popUp(component)) addClassName('popup', node)
    if (Identify.component.scrollView(component))
      addClassName('scroll-view', node)
    if (component.has('textBoard')) addClassName('text-board', node)
  },
} as RegisterOptions
