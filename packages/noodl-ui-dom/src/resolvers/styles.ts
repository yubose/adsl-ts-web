import {
  getAllResolversAsMap,
  hasLetter,
  hasDecimal,
  Resolver,
  Viewport,
  ComponentInstance,
} from 'noodl-ui'
import { NOODLDOMElement, RegisterOptions } from '../types'

let { getAlignAttrs, getPosition } = Object.entries(
  getAllResolversAsMap(),
).reduce((acc, [name, fn]) => {
  if (/(getAlignAttrs|getPosition)/i.test(name)) acc[name] = fn
  return acc
}, {} as any)

getAlignAttrs = new Resolver().setResolver(getAlignAttrs)
getPosition = new Resolver().setResolver(getPosition)

function addClassName(className: string, node: NOODLDOMElement) {
  if (!node.classList.contains(className)) {
    node.classList.add(className)
  }
}

const isPlo = (v: any): boolean =>
  v !== null && !Array.isArray(v) && typeof v === 'object'
const isNoodl = (v: any): v is string => typeof v === 'string' && !hasLetter(v)
const createEdit = (component: ComponentInstance) => (v: any, s?: any) => {
  if (isPlo(v)) component.assignStyles(v)
  else if (typeof v === 'string') component.setStyle(v, s)
}

export default {
  name: '[noodl-ui-dom] styles',
  cond: (node: NOODLDOMElement, component) =>
    !!(node && component && node?.tagName !== 'SCRIPT'),
  resolve: (node: HTMLElement, component, { noodlui }) => {
    const edit = createEdit(component)
    let style = component.style

    if (style !== null && typeof style === 'object') {
      const { top, left, width, height, marginTop } = style

      if (isNoodl(marginTop)) {
        edit(
          'marginTop',
          Viewport.getSize(marginTop, noodlui.viewport.height as number, {
            unit: 'px',
          }),
        )
      }

      if (isNoodl(top)) {
        edit(
          'top',
          Viewport.getSize(top, noodlui.viewport.height as number, {
            unit: 'px',
          }),
        )
      }

      if (isNoodl(height)) {
        edit(
          'height',
          Viewport.getSize(height, noodlui.viewport.height as number, {
            unit: 'px',
          }),
        )
      }

      if (isNoodl(left)) {
        edit(
          'left',
          Viewport.getSize(left, noodlui.viewport.width as number, {
            unit: 'px',
          }),
        )
      }

      if (isNoodl(width)) {
        edit(
          'width',
          Viewport.getSize(width, noodlui.viewport.width as number, {
            unit: 'px',
          }),
        )
      }

      getAlignAttrs.resolve(component)
      getPosition.resolve(component, {
        viewport: noodlui.viewport,
      })
    }

    style = component.style

    if (component.noodlType === 'popUp') {
      console.log(component.getStyle('visibility'))
    }

    if (style != null && typeof style === 'object' && node.style) {
      Object.entries(style).forEach(([k, v]) => {
        // if (/(marginTop|top|left|width|height)/i.test(k)) {
        // console.log({ [k]: v })
        // }
        node.style[k] = v
      })
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
