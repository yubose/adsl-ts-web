import {
  getAllResolversAsMap,
  hasLetter,
  Resolver,
  Viewport,
  ComponentInstance,
} from 'noodl-ui'
import { NOODLDOMElement, RegisterOptions } from '../types'
import { entries, isObj, isStr } from '../utils'

let { getAlignAttrs, getPosition } = Object.entries(
  getAllResolversAsMap(),
).reduce((acc, [name, fn]) => {
  if (/(getAlig|getPos)/i.test(name)) acc[name] = fn
  return acc
}, {} as any)

getAlignAttrs = new Resolver().setResolver(getAlignAttrs)
getPosition = new Resolver().setResolver(getPosition)

function addClassName(className: string, node: NOODLDOMElement) {
  if (!node.classList.contains(className)) {
    node.classList.add(className)
  }
}

const isNoodl = (v: any): v is string => typeof v === 'string' && !hasLetter(v)

class XYEditor {
  #component: ComponentInstance
  #viewport: Viewport

  constructor(component: ComponentInstance, viewport: Viewport) {
    this.#component = component
    this.#viewport = viewport
  }

  #updateVpProp = (prop: string, vpKey: string) => {
    this.edit(
      prop,
      Viewport.getSize(
        this.#component.style[prop],
        this.#viewport[vpKey] as number,
        { unit: 'px' },
      ),
    )
  }

  edit(key: string | Record<string, any>, s?: any) {
    if (isObj(key)) this.#component.assignStyles(key)
    else if (isStr(key)) this.#component.setStyle(key, s)
  }

  updateY(prop: string) {
    this.#updateVpProp(prop, 'height')
  }

  updateX(prop: string) {
    this.#updateVpProp(prop, 'width')
  }
}

const xKeys = ['left', 'width', 'marginLeft'] as const
const yKeys = ['top', 'height', 'marginTop'] as const
const posKeys = [...xKeys, ...yKeys]

function fixTextAlign(c: ComponentInstance) {
  const origStyle = c.original?.style || {}
  const axises = ['x', 'y'] as const
  axises.forEach((ax) => {
    if (isObj(origStyle.textAlign)) {
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

let _state: {
  [page: string]: {
    lastTop: number
  }
} = {}

export default {
  name: '[noodl-dom] Styles',
  cond: (node: NOODLDOMElement, component) =>
    !!(node && component && node?.tagName !== 'SCRIPT'),
  resolve: (node: HTMLElement, component, { noodlui }) => {
    const originalStyle = component.original?.style || {}
    let currentStyle = component.style

    if (isObj(currentStyle)) {
      const editor = new XYEditor(component, noodlui.viewport)

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

    currentStyle = component.style

    if (isObj(currentStyle) && node.style) {
      entries(currentStyle).forEach(([k, v]) => (node.style[k] = v))
    }

    /* -------------------------------------------------------
      ---- TEMP - Experimenting CSS
    -------------------------------------------------------- */

    if (component.noodlType === 'popUp') {
      addClassName('popup', node)
    }
    if (component.noodlType === 'scrollView') {
      addClassName('scroll-view', node)
    }
    if (component.has('textBoard')) {
      addClassName('text-board', node)
    }
  },
  after(node, component) {
    //
  },
} as RegisterOptions
