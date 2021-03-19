import get from 'lodash/get'
import { Identify } from 'noodl-types'
import { excludeIteratorVar } from 'noodl-utils'
import { ComponentInstance, ConsumerOptions } from '../types'
import { presets } from '../constants'
import { findListDataObject } from '../utils/noodl'
import * as com from '../utils/common'
import * as u from '../utils/internal'
import * as util from '../utils/style'

function createStyleEditor(component: ComponentInstance) {
  function editComponentStyles(
    styles: Record<string, any> | undefined,
    { remove }: { remove?: string | string[] | false } = {},
  ) {
    if (styles) {
      component?.edit?.(() => ({ style: styles }))
    }
    if (u.isArr(remove)) {
      remove.forEach((styleKey) => styleKey && delete component.style[styleKey])
    } else if (remove && u.isStr(remove)) delete component.style[remove]
  }
  return editComponentStyles
}

function resolveStyles(component: ComponentInstance, options: ConsumerOptions) {
  const { getBaseStyles, viewport } = options

  const edit = createStyleEditor(component)
  edit(getBaseStyles(component))
  const styles = component.original?.style || {}

  const {
    align,
    axis,
    borderRadius,
    borderWidth,
    display,
    fontFamily,
    fontSize,
    fontStyle,
    isHidden,
    margin,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    required,
    shadow,
    textAlign,
    zIndex,
  } = styles

  /* -------------------------------------------------------
    ---- ALIGNMENT
  -------------------------------------------------------- */

  // AXIS
  // if (axis === 'horizontal') {
  //   edit({ display: 'flex', flexWrap: 'nowrap' })
  // } else if (axis === 'vertical') {
  //   edit({ display: 'flex', flexDirection: 'column' })
  // }

  // TEXTALIGN
  if (textAlign) {
    // "centerX", "centerY", "left", "center", "right"
    if (u.isStr(textAlign)) {
      const value = util.getTextAlign(textAlign)
      if (!u.isNil(value)) {
        edit(value)
        // delete style.textAlign
      }
    }
    // { x, y }
    else if (u.isObj(textAlign)) {
      const { x, y } = textAlign
      if (x !== undefined) {
        const value = util.getTextAlign(x)
        if (value) {
          edit(value, { remove: !('textAlign' in value) && 'textAlign' })
        }
      }
      if (y !== undefined) {
        const value = util.getTextAlign(y)
        if (value) {
          // The y value needs to be handled manually here since util.getTextAlign will
          //    return { textAlign } which is meant for x
          if (y === 'center') {
            edit({ display: 'flex', alignItems: 'center' })
            if (textAlign?.x === 'center') edit({ justifyContent: 'center' })
          } else {
            edit(value, { remove: 'textAlign' })
          }
        }
      }
    }
  }

  // ALIGN
  if (align) {
    if (align === 'centerX') {
      edit(
        { display: 'flex', justifyContent: 'center' } /*{ remove: 'align' }*/,
      )
    } else if (align === 'centerY') {
      edit({ display: 'flex', alignItems: 'center' } /*{ remove: 'align' }*/)
    }
  }
  if (component.style?.textAlign) edit(undefined, { remove: 'textAlign' })

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

  if (styles.border !== undefined) {
    let borderStyle: any
    let color: any
    let width: any
    let line: any
    let border = styles.border as any

    if (border == '0') edit({ borderStyle: 'none' })

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

  component.style?.border?.style && delete component.style.border

  /* -------------------------------------------------------
    ---- COLORS - REMINDER: Convert color values like 0x00000000 to #00000000
  -------------------------------------------------------- */

  u.entries(styles).forEach(([key, value]) => {
    if (u.isStr(value)) {
      if (key === 'textColor') {
        // TODO: This shouldn't be disabled but enabling this makes some text white which
        //    becomes invisible on the page. Find out the solution to getting this right
        // result['textColor'] = value.replace('0x', '#')
        edit({ color: com.formatColor(value) }, { remove: 'textColor' })
      }
      if (value.startsWith('0x')) {
        // Convert other keys if they aren't formatted as well just in case
        if (key !== 'textColor') edit({ [key]: com.formatColor(value) })
      }
      const iteratorVar = component.original?.iteratorVar || ''
      if (iteratorVar && String(value).startsWith(iteratorVar)) {
        const dataObject = findListDataObject(component)
        if (u.isObj(dataObject)) {
          edit({
            [key]: com.formatColor(
              get(dataObject, excludeIteratorVar(value, iteratorVar), ''),
            ),
          })
        } else {
          edit({ [key]: com.formatColor(dataObject) })
        }
      }
    }
  })

  /* -------------------------------------------------------
    ---- FONTS
  -------------------------------------------------------- */

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

  /* -------------------------------------------------------
    ---- POSITION
  -------------------------------------------------------- */

  {
    // const { top, left } = styles
    // if (!u.isNil(zIndex)) edit({ zIndex: Number(zIndex) })
    // if (top == undefined) {
    //   edit({ top: 'auto' })
    // } else {
    //   edit(util.handlePosition(styles, 'top', viewport.height as number))
    // }
    // if (!u.isUnd(left)) {
    //   edit(util.handlePosition(styles, 'left', viewport.width as number))
    // }
  }

  /* -------------------------------------------------------
    ---- SIZES
  -------------------------------------------------------- */

  const { width, height } = styles
  if (width !== undefined) {
    edit({ width: String(util.getSize(width, viewport.width as number)) })
  }
  if (height !== undefined) {
    edit({ height: String(util.getSize(height, viewport.height as number)) })
  }

  /* -------------------------------------------------------
    ---- SPECIFIC TO COMPONENTS
  -------------------------------------------------------- */
  const { type } = component
  // TODO - Deprecate noodlType for just "type"
  const noodlType = component.noodlType

  if (noodlType === 'header') {
    edit({ zIndex: 100 })
  } else if (noodlType === 'image') {
    // Remove the height to maintain the aspect ratio since images are
    // assumed to have an object-fit of 'contain'
    if (!('height' in styles)) edit(undefined, { remove: 'height' })
    // Remove the width to maintain the aspect ratio since images are
    // assumed to have an object-fit of 'contain'
    if (!('width' in styles)) edit(undefined, { remove: 'width' })
    edit({ objectFit: 'contain' })
  } else if (['chatList', 'list'].includes(noodlType)) {
    edit({
      overflowX: 'hidden',
      overflowY: 'auto',
      listStyle: 'none',
      padding: '0px',
    })
    if (styles?.axis === 'horizontal') {
      edit({ display: 'flex' })
    } else {
      edit({ display: 'block' })
    }
  } else if (noodlType === 'listItem') {
    // Flipping the position to relative to make the list items stack on top of eachother.
    //    Since the container is a type: list and already has their entire height defined in absolute values,
    //    this shouldn't have any UI issues because they'll stay contained within
    edit({ listStyle: 'none', padding: 0, position: 'relative' })
  } else if (noodlType === 'popUp') {
    edit({ visibility: 'hidden' })
  } else if (noodlType === 'textView') {
    edit({ rows: 10 })
  } else if (noodlType === 'video') {
    edit({ objectFit: 'contain' })
  }

  /* -------------------------------------------------------
    ---- OTHER / UNCATEGORIZED
  -------------------------------------------------------- */

  // Margin
  // if (margin) edit({ margin })
  // if (marginTop) edit({ marginTop })
  // if (marginRight) edit({ marginRight })
  // if (marginBottom) edit({ marginBottom })
  // if (marginLeft) edit({ marginLeft })

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

  debugger
}

export default resolveStyles
