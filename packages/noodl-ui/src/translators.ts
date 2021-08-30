import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import * as c from './constants'

export function image() {
  //
}

export function path() {
  ///
}

export function resource() {
  ///
}

export const style = {
  align: (value: nt.StyleAlign) => {
    switch (value) {
      case 'centerX':
        return { display: 'flex', justifyContent: 'center' }
      case 'centerY':
        return { display: 'flex', alignItems: 'center' }
    }
  },
  axis: (value: nt.StyleAxis) => {
    switch (value) {
      case 'horizontal':
        return { display: 'flex', flexWrap: 'nowrap' }
      case 'vertical':
        return { display: 'flex', flexDirection: 'column' }
    }
  },
  fontStyle: (value: nt.StyleObject['fontStyle']) =>
    value === 'bold' ? { fontWeight: 'bold' } : undefined,
  isHidden: () => {},
  shadow: () => {},
  style: (value: nt.StyleBorderObject) => {
    let result = {} as Record<string, any>
    let borderStyle: any
    let color: any
    let width: any
    let line: any

    if (value == ('0' as any)) result.borderStyle = 'none'

    if (u.isObj(value)) {
      borderStyle = value.style
      color = value.color
      width = value.width
      line = value.line
    }

    if (color) result.borderColor = String(color).replace('0x', '#')
    if (line) result.borderStyle = line
    if (width) result.borderWidth = width

    // Analyizing border
    if (borderStyle == '1') {
      u.assign(result, c.presets.border['1'])
    } else if (borderStyle == '2') {
      u.assign(result, c.presets.border['2'])
    } else if (borderStyle == '3') {
      u.assign(result, c.presets.border['3'])
      if (!width) u.assign(result, { borderWidth: 'thin' })
    } else if (borderStyle == '4') {
      u.assign(result, c.presets.border['4'])
      if (!width) u.assign(result, { borderWidth: 'thin' })
    } else if (borderStyle == '5') {
      u.assign(result, c.presets.border['5'])
    } else if (borderStyle == '6') {
      u.assign(result, c.presets.border['6'])
    } else if (borderStyle == '7') {
      u.assign(result, c.presets.border['7'])
    }

    return result
  },
  textAlign: (value: nt.StyleTextAlign) => {
    // "centerX", "centerY", "left", "center", "right"
    if (u.isStr(value)) {
      if (value === 'left') return { textAlign: 'left' }
      else if (value === 'center') return { textAlign: 'center' }
      else if (value === 'right') return { textAlign: 'right' }
      else if (value === 'centerX') return { textAlign: 'center' }
      else if (value === 'centerY') {
        return { display: 'flex', alignItems: 'center' }
      }
    }
    // { x, y }
    else if (u.isObj(value)) {
      if (value.x != undefined) {
        return {
          textAlign: value.x === 'centerX' ? 'center' : value.x,
        }
      }
      if (value.y != undefined) {
        // The y value needs to be handled manually here since util.getTextAlign will
        //    return { textAlign } which is meant for x
        if (value.y === 'center' || value.y === 'centerY') {
          let convert = new Map([
            ['left', 'flex-start'],
            ['right', 'flex-end'],
            ['center', 'center'],
          ])
          // convert (left ,center ,right) to (flex-start | flex-end | center)
          return {
            display: 'flex',
            alignItems: 'center',
            justifyContent: convert.get(value.x ? value.x : 'left'),
          }
        }
      }
    }
  },
  textColor: () => {},
}
