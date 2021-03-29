import { Identify } from 'noodl-types'
import { Viewport as VP } from 'noodl-ui'
import { NOODLDOMElement, RegisterOptions } from '../types'
import { addClassName, entries, isObj } from '../utils/internal'

export default {
  name: '[noodl-dom] Styles',
  cond: (node, component) =>
    !!(node && component && node?.tagName !== 'SCRIPT'),
  before(node, component) {
    if (component.has('global')) {
      component.on('image', (src) => {
        console.log(
          `%cReceived src for Global Component`,
          `color:#00b406;`,
          src,
        )
        node && (node.style.backgroundImage = `url("${src}")`)
      })
    }
  },
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
    if (component.has('global')) addClassName('global', node)
  },
} as RegisterOptions
