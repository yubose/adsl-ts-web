import {
  getAllResolversAsMap,
  hasLetter,
  hasDecimal,
  Resolver,
  Viewport,
  ComponentInstance,
  ConsumerOptions,
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

class PositionEditor {
  #component: ComponentInstance
  #viewport: Viewport

  constructor(component: ComponentInstance, viewport: Viewport) {
    this.#component = component
    this.#viewport = viewport
  }

  #updateViewportStyleProp = (prop: string, vpKey: string) => {
    this.edit(
      prop,
      Viewport.getSize(
        this.#component.style[prop],
        this.#viewport[vpKey] as number,
        { unit: 'px' },
      ),
    )
  }

  edit(v: any, s?: any) {
    if (isPlo(v)) this.#component.assignStyles(v)
    else if (typeof v === 'string') this.#component.setStyle(v, s)
  }

  updateY(prop: string) {
    this.#updateViewportStyleProp(prop, 'height')
  }

  updateX(prop: string) {
    this.#updateViewportStyleProp(prop, 'width')
  }
}

const xKeys = ['left', 'width', 'marginLeft'] as const
const yKeys = ['top', 'height', 'marginTop'] as const
const posKeys = [...xKeys, ...yKeys]

function fixTextAlign(c: ComponentInstance) {
  const origStyle = c.original?.style || {}
  const axises = ['x', 'y'] as const
  axises.forEach((ax) => {
    if (isPlo(origStyle.textAlign)) {
      const origVal = origStyle.textAlign?.[ax]
      if (origVal) {
        if (ax === 'x') {
          if (c.style.textAlign !== origVal) {
            c.setStyle('textAlign', origVal)
          }
        } else {
          //
        }
      }
    } else if (typeof origStyle.textAlign === 'string') {
      const origVal = origStyle.textAlign
      if (origVal !== c.style.textAlign) {
        c.setStyle('textAlign', origVal)
      }
    }
  })
}

export default {
  name: '[noodl-ui-dom] styles',
  cond: (node: NOODLDOMElement, component) =>
    !!(node && component && node?.tagName !== 'SCRIPT'),
  resolve: (node: HTMLElement, component, { noodlui }) => {
    const originalStyle = component.original?.style || {}
    let style = component.style

    if (style !== null && typeof style === 'object') {
      const editor = new PositionEditor(component, noodlui.viewport)

      posKeys.forEach((key) => {
        if (isNoodl(originalStyle[key])) {
          if (xKeys.includes(key as any)) editor.updateX(key)
          else if (yKeys.includes(key as any)) editor.updateY(key)
        }
      })

      let hasFlexAlignCenter = () =>
        component.style.display === 'flex' &&
        component.style.alignItems === 'center'

      let hasFAC = hasFlexAlignCenter()

      getAlignAttrs.resolve(component)
      getPosition.resolve(component, {
        viewport: noodlui.viewport,
      })

      if (hasFAC !== hasFlexAlignCenter()) {
        if (hasFAC === false) {
          component.assignStyles({ display: 'flex', alignItems: 'center' })
          // component.setStyle('display', 'block')
          // component.removeStyle('alignItems')
          // component.removeStyle('display')
        }
      }

      fixTextAlign(component)
    }

    style = component.style

    if (style != null && typeof style === 'object' && node.style) {
      Object.entries(style).forEach(([k, v]) => {
        node.style[k] = v
      })
    }

    if (component.noodlType === 'popUp') {
      // if (style.visibility !== 'hidden') {
      //   style.visibility = 'hidden'
      // }
      addClassName('popup', node)
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
