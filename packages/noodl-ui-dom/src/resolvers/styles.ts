import { Identify, Identify as is } from 'noodl-types'
import { RegisterOptions } from '../types'
import { addClassName, entries, isObj } from '../utils/internal'

export default {
  name: '[noodl-dom] Styles',
  cond: (node, component) =>
    !!(node && component && node?.tagName !== 'SCRIPT'),
  before(node, component, { ndom }) {
    if (component.has?.('global')) {
      component.on('image', (src) => {
        node && (node.style.backgroundImage = `url("${src}")`)
      })
    }
  },
  resolve: (node, component, { page, signaturePad }) => {
    isObj(component.style?.textAlign) && delete component.style.textAlign

    entries(component.style).forEach(([styleKey, styleValue]) => {
      node.style[styleKey] = String(styleValue)
    })

    if (
      !('marginTop' in component.style) ||
      !('marginTop' in (component.blueprint?.style || {}))
    ) {
      component.style.marginTop = '0px'
    }

    if (is.component.canvas(component)) {
      const canvas = node as HTMLCanvasElement
      if (node.parentElement) {
        const parentWidth = node.parentElement.style.width
        const parentHeight = node.parentElement.style.height
        canvas.width = Number(parentWidth.replace(/[a-zA-Z]+/g, ''))
        canvas.height = Number(parentHeight.replace(/[a-zA-Z]+/g, ''))
        canvas.style.width = parentWidth
        canvas.style.height = parentHeight
        // canvas
        //   .getContext('2d')
        //   ?.scale(page.aspectRatioMin, page.aspectRatioMax)
      }
    }

    /* -------------------------------------------------------
      ---- TEMP - Experimenting CSS
    -------------------------------------------------------- */

    // if (is.component.canvas(component)) debugger

    is.component.canvas(component) && addClassName('canvas', node)
    is.component.page(component) && addClassName('page', node)
    is.component.popUp(component) && addClassName('popup', node)
    is.component.scrollView(component) && addClassName('scroll-view', node)
    component.has?.('global') && addClassName('global', node)
    component.has?.('textBoard') && addClassName('text-board', node)
  },
} as RegisterOptions
