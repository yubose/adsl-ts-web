import {
  getAllResolversAsMap,
  Resolver,
  ComponentInstance,
  isComponent,
  Viewport as VP,
} from 'noodl-ui'
import { Identify } from 'noodl-types'
import { NOODLDOMElement, RegisterOptions } from '../types'
import {
  addClassName,
  entries,
  fixTextAlign,
  isObj,
  xKeys,
  yKeys,
} from '../utils/internal'
import { eventId } from '../constants'

const getSize = VP.getSize
const getSizeTypeKey = (s: string) => (xKeys.includes(s) ? 'width' : 'height')
const posKeys = [...xKeys, ...yKeys]

let { getAlignAttrs, getPosition } = Object.entries(
  getAllResolversAsMap(),
).reduce((acc, [name, fn]) => {
  if (/(getAlig|getPos)/i.test(name)) acc[name] = fn
  return acc
}, {} as any)

getAlignAttrs = new Resolver().setResolver(getAlignAttrs)
getPosition = new Resolver().setResolver(getPosition)

class XYEditor {
  #component: ComponentInstance
  #viewport: VP

  constructor(component: ComponentInstance, viewport: VP) {
    this.#component = component
    this.#viewport = viewport
  }

  #updateVpProp = (prop: string, vpKey: string) => {
    this.#component.setStyle(
      prop,
      VP.getSize(this.#component.style[prop], this.#viewport[vpKey] as number, {
        unit: 'px',
      }),
    )
  }

  updateY(prop: string) {
    this.#updateVpProp(prop, 'height')
  }

  updateX(prop: string) {
    this.#updateVpProp(prop, 'width')
  }
}

export default {
  name: '[noodl-dom] Styles',
  cond: (node: NOODLDOMElement, component) =>
    !!(node && component && node?.tagName !== 'SCRIPT'),
  before(node, component) {
    if (VP.isNil(component.style.marginTop)) {
      component.style.marginTop = '0px'
    }
  },
  resolve: (node: HTMLElement, component, { noodlui }) => {
    const originalStyle = component?.original?.style || {}
    let currentStyle = component.style

    if (isObj(currentStyle)) {
      const editor = new XYEditor(component, noodlui.viewport)

      posKeys.forEach((key) => {
        if (VP.isNoodlUnit(originalStyle[key])) {
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

    if (component.noodlType === 'popUp') addClassName('popup', node)
    if (component.noodlType === 'scrollView') addClassName('scroll-view', node)
    if (component.has('textBoard')) addClassName('text-board', node)
  },
  after(node, component, { noodlui }) {
    if (!node || !component) return

    let top = component.style.top
    let height = component.style.height
    let parentIncSum = 0

    if (VP.isNil(top) || VP.isNil(height)) {
      let parent = component.parent() as ComponentInstance
      let parentTouchedProp = {} as Record<string, any>
      let newTop = 0
      // Get the parent's dimensions to initiate the newTop
      if (isComponent(parent)) {
        let parentStyle = parent.style || {}
        posKeys.forEach((key) => {
          if (!VP.isNil(parentStyle[key])) {
            const value = parentStyle[key] || ''
            parentTouchedProp[key] = value
            const incSum = getSize(
              value,
              noodlui.viewport[getSizeTypeKey(key)] as number,
            )
            parentIncSum += Number(incSum)
          }
        })
        newTop += parentIncSum
      }
      const topNum = VP.toNum(top)
      const heightNum = VP.toNum(height)
      const componentTopAndHeight = topNum + heightNum
      if (newTop !== componentTopAndHeight) component.style.top = newTop + 'px'
    }
  },
  observe: {
    [eventId.page.on.ON_BEFORE_APPEND_COMPONENT_CHILD_NODE]({
      page,
      component,
      child,
      childNode,
    }) {
      const renderState = page.state.render
      const currentTop = childNode?.getBoundingClientRect().bottom
      renderState.lastTop.value += currentTop - renderState.lastTop.value

      // Calculate the top
      if (
        isObj(child.original?.style) &&
        VP.isNil(child.original?.style?.top) &&
        !Identify.component.list(component.original)
      ) {
        child.style.top = childNode.getBoundingClientRect().top + 'px'
        childNode.style.top = child.style.top
      }

      // Calculate the height
      if (isObj(component.style) && VP.isNil(component.style.height)) {
        if (component.has('textBoard')) {
          child.style.height = childNode.getBoundingClientRect().height + 'px'
          childNode.style.height = child.style.height
          // renderState.lastTop += childNode.getBoundingClientRect().height
        }
      }
    },
  },
} as RegisterOptions
