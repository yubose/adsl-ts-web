import {
  ComponentInstance,
  isComponent,
  Viewport as VP,
  hasDecimal,
} from 'noodl-ui'
import { Identify } from 'noodl-types'
import { NOODLDOMElement, RegisterOptions } from '../types'
import {
  addClassName,
  entries,
  fixTextAlign,
  isArr,
  isObj,
  isStr,
  isNil,
  xKeys,
  yKeys,
  posKeys,
} from '../utils/internal'
import { eventId } from '../constants'

const getSize = VP.getSize
const getSizeTypeKey = (s: string) => (xKeys.includes(s) ? 'width' : 'height')

// let { getAlignAttrs, getPosition } = Object.entries(
//   getAllResolversAsMap(),
// ).reduce((acc, [name, fn]) => {
//   if (/(getAlig|getPos)/i.test(name)) acc[name] = fn
//   return acc
// }, {} as any)

// getAlignAttrs = new Resolver().setResolver(getAlignAttrs)
// getPosition = new Resolver().setResolver(getPosition)

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

function createStyleEditor(component: ComponentInstance) {
  function editComponentStyles(
    styles: Record<string, any> | undefined,
    { remove }: { remove?: string | string[] | false } = {},
  ) {
    styles && component.edit({ style: styles })
    if (isArr(remove)) {
      remove.forEach((styleKey) => styleKey && delete component.style[styleKey])
    } else if (remove && isStr(remove)) delete component.style[remove]
  }
  return editComponentStyles
}

// Copied from noodl-ui.
// TODO - Move somewhere else
function handlePosition(
  styleObj: any,
  key: 'top' | 'height' | 'width' | 'left',
  viewportSize: number,
) {
  const value = styleObj[key]
  // String
  if (typeof value === 'string') {
    if (value == '0') return { [key]: '0px' }
    if (value == '1') return { [key]: `${viewportSize}px` }
    if (!/[a-zA-Z]/i.test(value))
      return { [key]: VP.getRatio(viewportSize, value) + 'px' }
  }
  // Number
  else if (hasDecimal(styleObj[key]))
    return { [key]: VP.getRatio(viewportSize, value) + 'px' }

  return undefined
}

export default {
  name: '[noodl-dom] Styles',
  cond: (node: NOODLDOMElement, component) =>
    !!(node && component && node?.tagName !== 'SCRIPT'),
  before(node, component) {
    if (VP.isNil(component.original?.style?.marginTop)) {
      component.style.marginTop = '0px'
    }
  },
  resolve: (node: HTMLElement, component, { nui }) => {
    const originalStyle = component?.original?.style || {}
    let currentStyle = component.style

    if (isObj(currentStyle)) {
      const editor = new XYEditor(component, nui.getRootPage().viewport)
      const edit = createStyleEditor(component)

      posKeys.forEach((key) => {
        if (VP.isNoodlUnit(originalStyle[key])) {
          if (xKeys.includes(key as any)) editor.updateX(key)
          else if (yKeys.includes(key as any)) editor.updateY(key)
        }
  resolve: (node: HTMLElement, component) => {
    const originalStyle = component.original?.style || {}
    const { style } = component
    if (style != null && typeof style === 'object' && node.style) {
      if (component.has('text=func')) {
        // debugger
      }
      Object.entries(style).forEach(([k, v]) => {
        // if (k === 'height' && v === 'auto') {
        //   node.style.cssText += `height: inherit !important;`
        // } else {
        node.style[k] = v
        // }
      })

      let hasFlexAlignCenter = () =>
        component.style.display === 'flex' &&
        component.style.alignItems === 'center'

      let hasFAC = hasFlexAlignCenter()

      // TODO - Move handling of alignment somewhere else

      {
        /* -------------------------------------------------------
          ---- ALIGNMENT
        -------------------------------------------------------- */

        const { textAlign } = component.props()

        if (textAlign === 'left') edit({ textAlign: 'left' })
        else if (textAlign === 'center') edit({ textAlign: 'center' })
        else if (textAlign === 'right') edit({ textAlign: 'right' })
        else if (textAlign === 'centerX') edit({ textAlign: 'center' })
        else if (textAlign === 'centerY') {
          edit(
            { display: 'flex', alignItems: 'center' },
            { remove: 'textAlign' },
          )
        } else if (isObj(textAlign)) {
          if (textAlign.x !== undefined) {
            edit({
              textAlign: textAlign.x === 'centerX' ? 'center' : textAlign.x,
            })
          }
          if (textAlign.y !== undefined) {
            // The y value needs to be handled manually here since util.getTextAlign will
            //    return { textAlign } which is meant for x
            if (textAlign.y === 'center' || textAlign.y === 'centerY') {
              edit(
                { display: 'flex', alignItems: 'center' },
                { remove: 'textAlign' },
              )
              if (textAlign.x === 'center') edit({ justifyContent: 'center' })
            }
          }
        }

        /* -------------------------------------------------------
          ---- POSITION
        -------------------------------------------------------- */

        posKeys.forEach((key) => {
          const value = originalStyle[key]
          if (isNil(value)) {
            edit({ [key]: '0px' })
          } else {
          }
        })

        if ('zIndex' in component.style) {
          edit({ zIndex: Number(originalStyle.zIndex) })
        }

        if (!('top' in component.style)) {
          edit({ top: 'auto' })
        } else {
          edit(
            handlePosition(
              originalStyle,
              'top',
              nui.getRootPage().viewport.height,
            ),
          )
        }
        // Remove textAlign if it is an object (NOODL data type is not a valid DOM style attribute)
        if (isObj(component.style?.textAlign)) {
          edit(undefined, { remove: 'textAlign' })
        }
      }

      // getAlignAttrs.resolve(component)
      // getPosition.resolve(component, {
      //   viewport: nui.viewport,
      // })

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

    if (component.type === 'popUp') addClassName('popup', node)
    if (component.type === 'scrollView') addClassName('scroll-view', node)
    if (component.has('textBoard')) addClassName('text-board', node)
  },
  after(node, component, { nui }) {
    if (!node || !component) return

    let top = component.style.top
    let height = component.style.height
    let parentIncSum = 0

    if (VP.isNil(top) || VP.isNil(height)) {
      let parent = component.parent as ComponentInstance
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
              nui.getRootPage().viewport[getSizeTypeKey(key)] as number,
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

    if (!originalStyle?.top || originalStyle?.top === 'auto') {
      node.style.position = 'relative'
    } else {
      node.style.position = 'absolute'
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
