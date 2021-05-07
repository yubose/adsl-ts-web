import get from 'lodash/get'
import { Identify } from 'noodl-types'
import { excludeIteratorVar } from 'noodl-utils'
import { NUIComponent, ConsumerOptions } from '../types'
import { presets } from '../constants'
import { findListDataObject, findIteratorVar } from '../utils/noodl'
import ComponentResolver from '../Resolver'
import * as com from '../utils/common'
import * as u from '../utils/internal'
import * as util from '../utils/style'

function createStyleEditor(component: NUIComponent.Instance) {
  function editComponentStyles(
    styles: Record<string, any> | undefined,
    { remove }: { remove?: string | string[] | false } = {},
  ) {
    styles && component.edit({ style: styles })
    if (u.isArr(remove)) {
      remove.forEach((styleKey) => styleKey && delete component.style[styleKey])
    } else if (remove && u.isStr(remove)) delete component.style[remove]
  }
  return editComponentStyles
}

const resolveStyles = new ComponentResolver('resolveStyles')

resolveStyles.setResolver(
  (component: NUIComponent.Instance, options: ConsumerOptions, next) => {
    const { context, getBaseStyles, viewport } = options
    const edit = createStyleEditor(component)

    const originalStyles = component.blueprint?.style || {}
    const iteratorVar = context?.iteratorVar || findIteratorVar(component) || ''

    edit(getBaseStyles(component))

    const {
      align,
      axis,
      border,
      borderRadius,
      borderWidth,
      display,
      fontFamily,
      fontSize,
      fontStyle,
      isHidden,
      required,
      shadow,
      textAlign,
    } = originalStyles

    /* -------------------------------------------------------
    ---- ALIGNMENT
  -------------------------------------------------------- */

    // AXIS
    if (axis === 'horizontal') {
      edit({ display: 'flex', flexWrap: 'nowrap' }, { remove: 'axis' })
    } else if (axis === 'vertical') {
      edit({ display: 'flex', flexDirection: 'column' }, { remove: 'axis' })
    }

    // ALIGN
    if (align) {
      if (align === 'centerX') {
        edit({ display: 'flex', justifyContent: 'center' }, { remove: 'align' })
      } else if (align === 'centerY') {
        edit({ display: 'flex', alignItems: 'center' }, { remove: 'align' })
      }
    }

    // TEXTALIGN
    if (textAlign) {
      // "centerX", "centerY", "left", "center", "right"
      if (u.isStr(textAlign)) {
        if (textAlign === 'left') edit({ textAlign: 'left' })
        else if (textAlign === 'center') edit({ textAlign: 'center' })
        else if (textAlign === 'right') edit({ textAlign: 'right' })
        else if (textAlign === 'centerX') edit({ textAlign: 'center' })
        else if (textAlign === 'centerY') {
          edit(
            { display: 'flex', alignItems: 'center' },
            { remove: 'textAlign' },
          )
        }
      }
      // { x, y }
      else if (u.isObj(textAlign)) {
        if (textAlign.x != undefined) {
          edit({
            textAlign: textAlign.x === 'centerX' ? 'center' : textAlign.x,
          })
        }
        if (textAlign.y != undefined) {
          // The y value needs to be handled manually here since util.getTextAlign will
          //    return { textAlign } which is meant for x
          if (textAlign.y === 'center' || textAlign.y === 'centerY') {
            edit(
              { display: 'flex', alignItems: 'center' },
              { remove: !textAlign.x && 'textAlign' },
            )
            textAlign.x === 'center' && edit({ justifyContent: 'center' })
          }
        }
      }
    }

    // DISPLAY
    if (display === 'inline') edit({ display: 'inline' })

    /* -------------------------------------------------------
      ---- BORDERS
    -------------------------------------------------------- */

    /**
     * Returns border attributes according to the "border" property defined in the NOODL as well
     * as some native border attributes like "borderRadius"
     *    1) no border / no borderRadius/
     *    2) borderBottom / solid / no borderRadius/
     *    3) borderAll / solid / has borderRadius
     *    4) borderAll / dashed / no borderRadius
     *    5) no border / has borderRadius
     */

    if (border !== undefined) {
      let borderStyle: any
      let color: any
      let width: any
      let line: any

      if (border == ('0' as any)) edit({ borderStyle: 'none' })

      if (u.isObj(border)) {
        borderStyle = border.style
        color = border.color
        width = border.width
        line = border.line
      }

      if (color) edit({ borderColor: String(color).replace('0x', '#') })
      if (line) edit({ borderStyle: line })
      if (width) edit({ borderWidth: width })

      // Analyizing border
      if (borderStyle == '1') {
        edit(presets.border['1'])
      } else if (borderStyle == '2') {
        edit(presets.border['2'])
      } else if (borderStyle == '3') {
        edit(presets.border['3'])
        if (!width) edit({ borderWidth: 'thin' })
      } else if (borderStyle == '4') {
        edit(presets.border['4'])
        if (!width) edit({ borderWidth: 'thin' })
      } else if (borderStyle == '5') {
        edit(presets.border['5'])
      } else if (borderStyle == '6') {
        edit(presets.border['6'])
      } else if (borderStyle == '7') {
        edit(presets.border['7'])
      }
    }
    if (borderRadius) {
      if (u.isStr(borderRadius)) {
        if (!com.hasLetter(borderRadius)) {
          edit({ borderRadius: `${borderRadius}px` })
        }
      } else if (u.isNum(borderRadius)) {
        edit({ borderRadius: `${borderRadius}px` })
      }
    }
    if (borderWidth) {
      if (u.isStr(borderWidth)) {
        if (!com.hasLetter(borderWidth)) {
          edit({ borderWidth: `${borderWidth}px` })
        }
      } else if (u.isNum(borderWidth)) {
        edit({ borderWidth: `${borderWidth}px` })
      }
    }
    // If a borderRadius effect is to be expected and there is no border
    // (since no border negates borderRadius), we need to add an invisible
    // border to simulate the effect
    if (borderRadius) {
      const regex = /[a-zA-Z]+$/
      const radius = Number(`${borderRadius}`.replace(regex, ''))
      if (!isNaN(radius)) {
        edit({ borderRadius: `${radius}px` })
        if (
          !component.style.borderWidth ||
          component.style.borderWidth === 'none' ||
          component.style.borderWidth === '0px'
        ) {
          // Make the border invisible
          edit({ borderWidth: '1px', borderColor: 'rgba(0, 0, 0, 0)' })
        }
      }
    }

    border?.style && delete component.style.border

    /* -------------------------------------------------------
    ---- FONTS
  -------------------------------------------------------- */

    if (!u.isUnd(fontSize)) {
      // '10' --> '10px'
      if (u.isStr(fontSize) && !com.hasLetter(fontSize)) {
        edit({ fontSize: `${fontSize}px` })
      }
      // 10 --> '10px'
      else if (u.isNum(fontSize)) {
        edit({ fontSize: `${fontSize}px` })
      }
      if (u.isStr(fontFamily)) {
        edit({ fontFamily })
      }
      // { fontStyle } --> { fontWeight }
      if (fontStyle === 'bold') {
        edit({ fontWeight: 'bold' }, { remove: 'fontStyle' })
      }

      // if ('fontSize' in (component.blueprint?.style || {})) {
      //   const val = Number(component.blueprint.style?.fontSize)
      //   if (u.isNum(val) && !Number.isNaN(val)) {
      //     const result = util.handlePosition(
      //       component.blueprint.style,
      //       'fontSize',
      //       viewport.width,
      //     )
      //     if (result) {
      //       u.assign(component.style, result)
      //     }
      //   }
      // }
    }

    /* -------------------------------------------------------
    ---- POSITION
  -------------------------------------------------------- */

    {
      util.posKeys.forEach((key) => {
        if (!u.isNil(component.blueprint?.style?.[key])) {
          const result = util.handlePosition(
            component.blueprint.style,
            key as any,
            viewport[util.xKeys.includes(key) ? 'width' : 'height'],
          )
          if (result) {
            u.assign(component.style, result)
          }
        }
      })
      // Remove textAlign if it is an object (NOODL data type is not a valid DOM style attribute)
      if (u.isObj(component.style?.textAlign)) {
        delete component.style.textAlign
      }
    }

    /* -------------------------------------------------------
    ---- SIZES
  -------------------------------------------------------- */

    const { width, height } = originalStyles
    if (!u.isNil(width)) {
      edit({ width: String(util.getSize(width, viewport.width)) })
    }
    if (!u.isNil(height)) {
      edit({ height: String(util.getSize(height, viewport.height)) })
    }

    /* -------------------------------------------------------
    ---- COMPONENTS
  -------------------------------------------------------- */

    if (Identify.component.header(component)) {
      edit({ zIndex: 100 })
    } else if (Identify.component.image(component)) {
      // Remove the height to maintain the aspect ratio since images are
      // assumed to have an object-fit of 'contain'
      if (!('height' in originalStyles)) edit(undefined, { remove: 'height' })
      // Remove the width to maintain the aspect ratio since images are
      // assumed to have an object-fit of 'contain'
      if (!('width' in originalStyles)) edit(undefined, { remove: 'width' })
      edit({ objectFit: 'contain' })
    } else if (Identify.component.listLike(component)) {
      edit({
        display: originalStyles?.axis === 'horizontal' ? 'flex' : 'block',
        listStyle: 'none',
        // overflowX: 'hidden',
        padding: '0px',
      })
    } else if (Identify.component.listItem(component)) {
      // Flipping the position to relative to make the list items stack on top of eachother.
      //    Since the container is a type: list and already has their entire height defined in absolute values,
      //    this shouldn't have any UI issues because they'll stay contained within
      edit({ listStyle: 'none', padding: 0 })
    } else if (Identify.component.popUp(component)) {
      edit({ visibility: 'hidden' })
    } else if (Identify.component.scrollView(component)) {
      edit({ display: 'block' })
    } else if (Identify.component.textView(component)) {
      edit({ rows: 10 })
    } else if (Identify.component.video(component)) {
      edit({ objectFit: 'contain' })
    }

    /* -------------------------------------------------------
    ---- OTHER / UNCATEGORIZED
  -------------------------------------------------------- */

    // Shadow
    if (Identify.isBooleanTrue(shadow)) {
      edit(
        { boxShadow: '5px 5px 10px 3px rgba(0, 0, 0, 0.015)' },
        { remove: 'shadow' },
      )
    }

    // Visibility
    Identify.isBooleanTrue(isHidden) && edit({ visibility: 'hidden' })

    // ??
    if (Identify.isBoolean(required)) {
      edit({ required: Identify.isBooleanTrue(required) })
    }

    // HANDLING ARTBITRARY STYLES
    u.eachEntries(originalStyles, (styleKey, value) => {
      if (u.isStr(value)) {
        if (
          styleKey === 'textColor' ||
          value.startsWith('0x') ||
          (iteratorVar && value.startsWith(iteratorVar))
        ) {
          /* -------------------------------------------------------
            ---- COLORS - REMINDER: Convert color values like 0x00000000 to #00000000
          -------------------------------------------------------- */
          if (styleKey === 'textColor') {
            return edit(
              { color: com.formatColor(value) },
              { remove: 'textColor' },
            )
          } else {
            // Convert other keys if they aren't formatted as well just in case
            if (value.startsWith('0x'))
              edit({ [styleKey]: com.formatColor(value) })
            // Some list item consumers have data keys referencing color data values
            // They are in the 0x0000000 form so we must convert them to be DOM compatible
            if (iteratorVar && value.startsWith(iteratorVar)) {
              const dataObject = findListDataObject(component)
              if (u.isObj(dataObject)) {
                edit({
                  [styleKey]: com.formatColor(
                    get(dataObject, excludeIteratorVar(value, iteratorVar), ''),
                  ),
                })
              } else {
                edit({ [styleKey]: com.formatColor(dataObject) })
              }
            }
          }
        }
      }
    })

    next?.()
  },
)

export default resolveStyles
