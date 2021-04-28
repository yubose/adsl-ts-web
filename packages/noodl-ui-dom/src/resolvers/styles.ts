import { Identify as is } from 'noodl-types'
import { Viewport as VP } from 'noodl-ui'
import { RegisterOptions } from '../types'
import { addClassName, entries, isObj } from '../utils/internal'

export default {
  name: '[noodl-dom] Styles',
  cond: (node, component) =>
    !!(node && component && node?.tagName !== 'SCRIPT'),
  before(node, component, { ndom }) {
    if (component.has('global')) {
      component.on('image', (src) => {
        console.log(`%cReceived src for Global Component`, `color:#00b406;`, {
          src,
          nodeId: node.id,
          componentId: component.id,
          globalId: component.get('globalId'),
          globalObject: ndom.global.components[component.get('globalId')],
        })
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

    is.component.page(component) && addClassName('page', node)
    is.component.popUp(component) && addClassName('popup', node)
    is.component.scrollView(component) && addClassName('scroll-view', node)
    component.has('global') && addClassName('global', node)
    component.has('textBoard') && addClassName('text-board', node)
  },
} as RegisterOptions
