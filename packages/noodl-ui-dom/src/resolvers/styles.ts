import {
  getAllResolversAsMap,
  Resolver,
  ComponentInstance,
  isComponent,
  Viewport,
} from 'noodl-ui'
import { isDraft, current } from 'immer'
import { NOODLDOMElement, RegisterOptions } from '../types'
import {
  addClassName,
  entries,
  fixTextAlign,
  isNoodlUnit,
  isObj,
  isStr,
  isUnd,
  toNum,
  xKeys,
  yKeys,
} from '../utils/internal'
import { eventId } from '../constants'

const getSize = Viewport.getSize
const getSizeTypeKey = (s: string) => (xKeys.includes(s) ? 'width' : 'height')
const posKeys = [...xKeys, ...yKeys]

const isNil = (v: any): v is null | undefined | '' | 'auto' =>
  v === null || isUnd(v) || v === 'auto' || v === ''

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

export default {
  name: '[noodl-dom] Styles',
  cond: (node: NOODLDOMElement, component) =>
    !!(node && component && node?.tagName !== 'SCRIPT'),
  before(node, component, ctx) {
    // if (component.length) {
    //   const child1 = component.child() as ComponentInstance
    //   if (child1) {
    //     const origChildStyle = child1.original?.style
    //     if (isNil(origChildStyle?.top)) {
    //       console.log(
    //         `%cSetting first child's top (${origChildStyle?.top}) to be the same ` +
    //           `as its parent (${component.style.top}) because it is missing`,
    //         `color:#95a5a6;`,
    //         { node, component, child: child1 },
    //       )
    //       console.info('HELLO')
    //       console.info(child1.style.top)
    //       console.info(component.style.top)
    //       child1.style.top = component.style.top
    //       console.info('BYE')
    //       console.info(child1.style.top)
    //       console.info(component.style.top)
    //     }
    //   }
    // }
  },
  resolve: (node: HTMLElement, component, { noodlui }) => {
    const originalStyle = component?.style || {}
    let currentStyle = component.style

    if (isObj(currentStyle)) {
      const editor = new XYEditor(component, noodlui.viewport)

      posKeys.forEach((key) => {
        if (isNoodlUnit(originalStyle[key])) {
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
  after(node, component, { noodlui, noodluidom, state }) {
    if (!node || !component) return

    if (isNil(component?.style?.top)) {
      const bounds = node.getBoundingClientRect()
      state.render.lastTop += bounds.height
    }

    let top = component.style.top
    let height = component.style.height
    let parentIncSum = 0

    if (isNil(top) || isNil(height)) {
      let parent = component.parent() as ComponentInstance
      let parentTouchedProp = {} as Record<string, any>
      let newTop = 0
      // Get the parent's dimensions to initiate the newTop
      if (isComponent(parent)) {
        let parentStyle = parent.style || {}
        posKeys.forEach((key) => {
          if (!isNil(parentStyle[key])) {
            const value = parentStyle[key] || ''
            parentTouchedProp[key] = value
            const incSum = getSize(
              value,
              noodlui.viewport[getSizeTypeKey(key)] as number,
            )
            // console.log(
            //   `%cAdding incoming parent sum of ${parentIncSum} to incSum of ${incSum}`,
            //   `color:#95a5a6;`,
            //   {
            //     parent,
            //     parentIncSum,
            //     incSum,
            //     top,
            //     height,
            //   },
            // )
            parentIncSum += Number(incSum)
          }
        })
        // console.log(
        //   `%cAdding parentIncSum of ${parentIncSum} to newTop of ${newTop}`,
        //   `color:#95a5a6;`,
        // )
        newTop += parentIncSum
      }
      const topNum = toNum(top)
      const heightNum = toNum(height)
      const componentTopAndHeight = topNum + heightNum
      if (newTop !== componentTopAndHeight) {
        // node.style.top = newTop + 'px'
        component.style.top = newTop + 'px'
        // renderState.lastTop += newTop
      }
      // console.log([
      //   [newTop, parentIncSum],
      //   top,
      //   height,
      //   component.parent()?.style.top,
      //   component.parent()?.style.height,
      //   renderState,
      // ])
      // for (const elem of noodluidom.page.rootNode.children) {
      //   const childrenNodes = Array.from(elem.children)
      //   // Temp for debugging
      //   childrenNodes.forEach((elem) => {
      //     if (elem instanceof HTMLImageElement) {
      //       // elem.style.position = 'absolute'
      //       // elem.style.top = '0px'
      //     }
      //   })
      // }
    }
  },
  observe: {
    [eventId.page.on.ON_AFTER_APPEND_CHILD]({
      component: componentOptions,
      child: childOptions,
    }) {
      if (componentOptions.instance.length) {
        if (childOptions.index === 0) {
          const component = componentOptions.instance
          const child1 = component.child() as ComponentInstance
          if (child1) {
            if (isNil(child1.original?.style?.top)) {
              console.log(
                `%cSetting first child's top (${child1.original?.style?.top}) to be the same ` +
                  `as its parent (${component.style.top}) because it is missing`,
                `color:#95a5a6;`,
                { node: componentOptions.node, component, child: child1 },
              )
              child1.style.top = component.style.top
              childOptions.node.style.top = component.style.top
            }
          }
        }
      }

      // const props = component.instance.props()
      // const childProps = child.instance.props()
      //
      // Resolve the top/height and update lastTop for child nodes to follow
      // console.log({
      //   component,
      //   child,
      //   ndom: this,
      //   originalStyle: component.instance.original?.style,
      //   currentStyle: isDraft(component.instance.style)
      //     ? current(component.instance.style)
      //     : component.instance.style,
      // })
    },
  },
} as RegisterOptions
