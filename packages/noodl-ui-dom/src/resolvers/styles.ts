import {
  getAllResolversAsMap,
  Resolver,
  ComponentInstance,
  isComponent,
  Viewport as VP,
} from 'noodl-ui'
import { NOODLDOMElement, RegisterOptions } from '../types'
import {
  addClassName,
  entries,
  fixTextAlign,
  isNum,
  isObj,
  isStr,
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
    this.edit(
      prop,
      VP.getSize(this.#component.style[prop], this.#viewport[vpKey] as number, {
        unit: 'px',
      }),
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
    const originalStyle = component?.style || {}
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

    if (!('marginTop' in originalStyle)) {
      component.style.marginTop = '0px'
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
    [eventId.page.on.ON_CHILD_NODES_RENDERED]({
      blueprint,
      component,
      node,
      page,
    }) {
      // Calculate the height
      if (isObj(blueprint.style) && VP.isNil(blueprint.style.height)) {
        const bounds = node.getBoundingClientRect()
        const clientHeight = node.clientHeight // Includes padding -- Excludes borders, margins, horizontal scrollbars
        const offsetHeight = node.offsetHeight // Includes padding, border, horizontal scrollbars
        const scrollHeight = node.scrollHeight // Actual content of the element, regardless if any content is hidden inside scrollbars
        const renderState = page.state.render
        const vh = page.viewport.height
        const marginTop = component.style.marginTop
        const top = component.style.top
        const height = component.style.height

        console.log({
          origHeight: blueprint.style.height,
          bounds,
          node,
          marginTop,
          top,
          height,
          clientHeight,
          offsetHeight,
          scrollHeight,
        })

        // if (VP.isNil(marginTop)) {
        //   component.style.marginTop = '0px'
        // } else {
        //   if (VP.isNoodlUnit(marginTop)) {
        //     component.style.marginTop =
        //       VP.getSize(marginTop, vh, { unit: 'px' }) || undefined
        //   } else {
        //     console.log(
        //       `%cREMINDER: If you see this message go fix this ASAP`,
        //       `color:#ec0000;`,
        //     )
        //   }
        // }
        // if (!VP.isNil(component.style.top)) {
        //   if (VP.isNoodlUnit(component.style.top))
        //     renderState.lastTop += Number(VP.getSize(component.style.top, vh))
        // } else {
        //   component.style.top = '0px'
        // }
        // if (!VP.isNil(height)) {
        //   if (VP.isNoodlUnit(height)) {
        //     const result = Number(VP.getSize(height, vh))
        //     if (isNum(result)) {
        //       component.style.height = result + 'px'
        //       renderState.lastTop += result
        //     }
        //   } else {
        //     // console.log({
        //     //   offsetHeight: node.offsetHeight,
        //     //   clientTop: node.clientTop,
        //     //   scrollTop: node.scrollTop,
        //     //   height,
        //     //   node,
        //     // })
        //     // renderState.lastTop += VP.toNum(
        //     //   VP.getSize(VP.toNum(height), vh),
        //     // )
        //   }
        // }
      }
    },
  },
} as RegisterOptions
