import * as u from '@jsmanifest/utils'
import get from 'lodash/get'
import { Identify } from 'noodl-types'
import { excludeIteratorVar } from 'noodl-utils'
import type { NuiComponent } from '../types'
import { presets } from '../constants'
import { findListDataObject, findIteratorVar } from '../utils/noodl'
import ComponentResolver from '../Resolver'
import VP from '../Viewport'
import * as com from '../utils/common'
import * as util from '../utils/style'

const isNil = (v: any) => u.isNull(v) || u.isUnd(v)

function createStyleEditor(component: NuiComponent.Instance) {
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

resolveStyles.setResolver(async (component, options, next) => {
  const { context, getBaseStyles, viewport, getRoot, page } = options
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
        edit({ display: 'flex', alignItems: 'center' }, { remove: 'textAlign' })
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
          let convert = new Map([
            ['left', 'flex-start'],
            ['right', 'flex-end'],
            ['center', 'center'],
          ])
          // convert (left ,center ,right) to (flex-start | flex-end | center)
          edit(
            {
              display: 'flex',
              alignItems: 'center',
              justifyContent: convert.get(textAlign.x ? textAlign.x : 'left'),
            },
            { remove: !textAlign.x && 'textAlign' },
          )
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
  if (borderWidth) {
    if (u.isStr(borderWidth)) {
      if (!com.hasLetter(borderWidth)) {
        edit({ borderWidth: `${borderWidth}px` })
      }
    } else if (u.isNum(borderWidth)) {
      edit({ borderWidth: `${borderWidth}px` })
    }
  }
  if (borderRadius) {
    if (util.isNoodlUnit(borderRadius)) {
      edit({
        borderRadius: String(util.getSize(borderRadius, viewport.height)),
      })
    } else {
      if (u.isStr(borderRadius)) {
        if (!com.hasLetter(borderRadius)) {
          edit({ borderRadius: borderRadius + 'px' })
        } else {
          edit({ borderRadius: `${borderRadius}` })
        }
      } else if (u.isNum(borderRadius)) {
        edit({ borderRadius: `${borderRadius}px` })
      }

      // If a borderRadius effect is to be expected and there is no border
      // (since no border negates borderRadius), we need to add an invisible
      // border to simulate the effect
      const regex = /[a-zA-Z]+$/
      const radius = Number(`${borderRadius}`.replace(regex, ''))
      if (!Number.isNaN(radius)) {
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
  }

  border?.style && delete component.style.border

  /* -------------------------------------------------------
    ---- FONTS
  -------------------------------------------------------- */

  if (!u.isUnd(fontSize)) {
    // '10' --> '10px'
    if (u.isStr(fontSize)) {
      if (!com.hasLetter(fontSize)) {
        if (util.isNoodlUnit(fontSize)) {
          edit({ fontSize: String(VP.getSize(fontSize, viewport.height)) })
        } else {
          edit({ fontSize: `${fontSize}px` })
        }
      }
    }
    // 10 --> '10px'
    else if (u.isNum(fontSize)) edit({ fontSize: `${fontSize}px` })
    u.isStr(fontFamily) && edit({ fontFamily })
  }

  // { fontStyle } --> { fontWeight }
  if (fontStyle === 'bold') {
    edit({ fontWeight: 'bold' }, { remove: 'fontStyle' })
  }

  /* -------------------------------------------------------
      ---- POSITION
    -------------------------------------------------------- */

  {
    util.posKeys.forEach((posKey) => {
      if (!isNil(component.blueprint?.style?.[posKey])) {
        const result = util.getPositionProps(
          component.blueprint?.style,
          posKey as any,
          viewport?.[util.xKeys.includes(posKey as any) ? 'width' : 'height'],
        )
        result && u.assign(component.style, result)
      }
    })
    // Remove textAlign if it is an object (NOODL data type is not a valid DOM style attribute)
    u.isObj(component.style?.textAlign) && delete component.style.textAlign
  }

  /* -------------------------------------------------------
      ---- SIZES
    -------------------------------------------------------- */

  const { width, height, maxHeight, maxWidth, minHeight, minWidth } =
    originalStyles || {}

  if (viewport) {
    if (!isNil(width)) {
      edit({ width: String(util.getSize(width as any, viewport.width)) })
    }

    if (!isNil(height)) {
      // When the value needs to change whenever the viewport height changes
      if (util.isNoodlUnit(height)) {
        edit({ height: String(util.getSize(height, viewport.height)) })
      } else {
        if (height == 1 || height == '1') {
          edit({ height: String(util.getSize(height, viewport.height)) })
        } else {
          edit({
            height: String(util.getSize(height as any, viewport.height)),
          })
        }
      }
    }

    //maxHeight,maxWidth,miniHeight,miniWidth
    if (!isNil(maxHeight)) {
      edit({
        maxHeight: String(util.getSize(maxHeight as any, viewport.height)),
      })
    }
    if (!isNil(maxWidth)) {
      edit({ maxWidth: String(util.getSize(maxWidth as any, viewport.width)) })
    }
    if (!isNil(minHeight)) {
      edit({
        minHeight: String(util.getSize(minHeight as any, viewport.height)),
      })
    }
    if (!isNil(minWidth)) {
      edit({ minWidth: String(util.getSize(minWidth as any, viewport.width)) })
    }
  }

  /* -------------------------------------------------------
    ---- COMPONENTS
  -------------------------------------------------------- */

  if (Identify.component.header(component)) {
    edit({ zIndex: 100 })
  } else if (Identify.component.image(component)) {
    if (u.isObj(originalStyles)) {
      // Remove the height to maintain the aspect ratio since images are
      // assumed to have an object-fit of 'contain'
      if (!('height' in originalStyles)) edit(undefined, { remove: 'height' })
      // Remove the width to maintain the aspect ratio since images are
      // assumed to have an object-fit of 'contain'
      if (!('width' in originalStyles)) edit(undefined, { remove: 'width' })

      if (!('objectFit' in originalStyles)) {
        edit({ objectFit: 'contain' })
      }
    }
  } else if (Identify.component.listLike(component)) {
    edit({
      display: originalStyles?.axis === 'horizontal' ? 'flex' : 'block',
      listStyle: 'none',
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
      // Cache this value to the variable so it doesn't get mutated inside this func since there are moments when value is changing before this func ends
      // If the value is a path of a list item data object
      const isListPath = iteratorVar && value.startsWith(iteratorVar)
      if (Identify.reference(value)) {
        // Local
        if (u.isStr(value) && value.startsWith?.('..')) {
          value = get(getRoot()[page?.page || ''], value.substring(2))
        }
        // Root
        else if (u.isStr(value) && value.startsWith?.('.')) {
          value = get(getRoot(), value.substring(1))
        }
        edit({ [styleKey]: com.formatColor(value) })
      }

      // TODO - Find out how to resolve the issue of "value" being undefined without this string check when we already checked above this
      if (
        u.isStr(value) &&
        (styleKey === 'textColor' || value.startsWith('0x') || isListPath)
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
          if (u.isStr(value) && value.startsWith('0x')) {
            edit({ [styleKey]: com.formatColor(value) })
          }

          // Some list item consumers have data keys referencing color data values
          // They are in the 0x0000000 form so we must convert them to be DOM compatible
          if (isListPath) {
            const dataObject = findListDataObject(component)
            if (u.isObj(dataObject)) {
              const dataKey = excludeIteratorVar(value, iteratorVar) as string

              let styleValue = get(dataObject, dataKey)

              styleValue = com.formatColor(styleValue)

              if (util.vpHeightKeys.includes(styleKey as any)) {
                if (util.isNoodlUnit(styleValue)) {
                  edit({
                    [styleKey]: String(
                      VP.getSize(styleValue, viewport.height, { unit: 'px' }),
                    ),
                  })
                }
              } else {
                edit({ [styleKey]: styleValue })
              }
            } else {
              edit({ [styleKey]: com.formatColor(String(dataObject)) })
            }
          }
        }
      }

      if (Number.isNaN(value)) {
        console.log(
          `%cAlert!! The value for style key "${styleKey}" is "${value}"`,
          `color:#ec0000;`,
          { component, styleKey, styleValue: value },
        )
      }
    }
  })

  return next?.()
})

export default resolveStyles
