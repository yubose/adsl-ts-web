import { Identify } from 'noodl-types'
import { NUIComponent, Viewport as VP } from 'noodl-ui'
import { NOODLDOMElement, RegisterOptions } from '../types'
import {
  addClassName,
  entries,
  fixTextAlign,
  isArr,
  isObj,
  isStr,
} from '../utils/internal'
import { eventId } from '../constants'

function createStyleEditor(component: NUIComponent.Instance) {
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
  // hasDecimal
  else if (Number(styleObj[key]) % 1 !== 0)
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
      const edit = createStyleEditor(component)

      let hasFlexAlignCenter = () =>
        component.style.display === 'flex' &&
        component.style.alignItems === 'center'

      let hasFAC = hasFlexAlignCenter()

      // TODO - Move handling of alignment somewhere else

      {
        /* -------------------------------------------------------
          ---- ALIGNMENT
        -------------------------------------------------------- */

        const { textAlign } = originalStyle

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

        if (hasFAC !== hasFlexAlignCenter()) {
          if (hasFAC !== false) edit({ display: 'flex', alignItems: 'center' })
        }

        if ('zIndex' in component.style) {
          edit({ zIndex: Number(component.style.zIndex) })
        }
      }

      fixTextAlign(component)

      // Remove textAlign if it is an object (NOODL data type is not a valid DOM style attribute)
      if (isObj(component.style?.textAlign)) {
        edit(undefined, { remove: 'textAlign' })
      }

      /* -------------------------------------------------------
      ---- TEMP - Experimenting CSS
    -------------------------------------------------------- */

      if (Identify.component.popUp(component)) addClassName('popup', node)
      if (Identify.component.scrollView(component))
        addClassName('scroll-view', node)
      if (component.has('textBoard')) addClassName('text-board', node)
    }

    // entries(currentStyle).forEach(([styleKey, styleValue]) => {
    //   node.style[styleKey] = styleValue
    // })

    Object.entries(currentStyle).forEach(([k, v]) => {
      node.style[k] = v
    })
  },
  observe: {
    [eventId.page.on.ON_BEFORE_APPEND_COMPONENT_CHILD_NODE]({
      node,
      child,
      childNode,
    }) {
      if (
        !child?.original?.style?.top ||
        child?.original?.style?.top === 'auto'
      ) {
        childNode.style.position = 'relative'
      } else {
        childNode.style.position = 'absolute'
      }
    },
  },
} as RegisterOptions
