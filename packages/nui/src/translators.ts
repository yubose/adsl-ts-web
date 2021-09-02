import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import flowRight from 'lodash/flowRight'
import wrap from 'lodash/wrap'
import { h } from 'snabbdom'
import { hasDecimal, hasLetter } from './utils/common'
import VP from './Viewport'
import * as c from './constants'
import * as t from './types'
import * as i from './utils/internal'
import { ComponentObject } from 'noodl-types'

class Translators {
  #translators = new Map<string, t.Resolve.TranslateFn>()

  get translators() {
    return this.#translators
  }

  translate<K extends string>(key: K, fn: t.Resolve.TranslateFn) {
    this.translators.set(key, fn)
  }

  execute({ component }: t.Resolve.ResolverFnOptions) {
    const options = {
      component,
      viewport: new VP({ width: 375, height: 667 }),
      vprops: {
        attrs: {},
        classes: {},
        dataset: {},
        hooks: {},
        on: {},
        style: {},
      },
    } as t.Resolve.ResolverFnOptions

    const translators = u.reduce(
      flowRight(...this.#translators),
      (acc, [key, fn]) => acc(fn),
      (x: (...args: any[]) => any) => x,
    )
    const transform = translators((x) => x)
    const result = transform(component)

    console.log(`Result`, result)
  }
}

const translators = new Translators()

translators.translate('axis', function (value: nt.StyleAxis) {
  switch (value) {
    case 'horizontal':
      return { display: 'flex', flexWrap: 'nowrap' }
    case 'vertical':
      return { display: 'flex', flexDirection: 'column' }
  }
})

translators.translate('align', function (value: nt.StyleAlign) {
  switch (value) {
    case 'centerX':
      return { display: 'flex', justifyContent: 'center' }
    case 'centerY':
      return { display: 'flex', alignItems: 'center' }
  }
})

translators.translate(
  'border',
  function (value: nt.StyleBorderObject | string | number) {
    const styles = {} as Record<string, any>

    if (value == '0') {
      styles.borderStyle = 'none'
    } else if (u.isObj(value)) {
      let { borderStyle, color, width, line } = value

      color && (styles.borderColor = String(color).replace('0x', '#'))
      line && (styles.borderStyle = line)
      width && (styles.borderWidth = width)

      if (borderStyle == '1') {
        u.assign(styles, c.borderPresets['1'])
      } else if (borderStyle == '2') {
        u.assign(styles, c.borderPresets['2'])
      } else if (borderStyle == '3') {
        u.assign(styles, c.borderPresets['3'])
        if (!width) u.assign(styles, { borderWidth: 'thin' })
      } else if (borderStyle == '4') {
        u.assign(styles, c.borderPresets['4'])
        if (!width) u.assign(styles, { borderWidth: 'thin' })
      } else if (borderStyle == '5') {
        u.assign(styles, c.borderPresets['5'])
      } else if (borderStyle == '6') {
        u.assign(styles, c.borderPresets['6'])
      } else if (borderStyle == '7') {
        u.assign(styles, c.borderPresets['7'])
      }
    }

    return styles
  },
)

translators.translate(
  'borderRadius',
  function (value: string | number, { component, viewport }) {
    if (VP.isNoodlUnit(value) && u.isNum(viewport.height)) {
      return { borderRadius: String(VP.getSize(value, viewport.height)) }
    }

    const styles = {} as Record<string, any>

    if (u.isStr(value)) {
      if (!hasLetter(value)) styles.borderRadius = `${value}px`
      else styles.borderRadius = `${value}`
    } else if (u.isNum(value)) {
      styles.borderRadius = `${value}px`
    }

    // If a borderRadius effect is to be expected and there is no border
    // (since no border negates borderRadius), we need to add an invisible
    // border to simulate the effect
    const regex = /[a-zA-Z]+$/
    const radius = Number(`${value}`.replace(regex, ''))

    if (!Number.isNaN(radius)) {
      styles.borderRadius = `${radius}px`
      if (component?.style) {
        if (
          !component.style.borderWidth ||
          component.style.borderWidth === 'none' ||
          component.style.borderWidth === '0px'
        ) {
          // Make the border invisible
          u.assign(styles, {
            borderWidth: '1px',
            borderColor: 'rgba(0, 0, 0, 0)',
          })
        }
      }
    }

    return styles
  },
)

translators.translate('borderWidth', function (value: string | number) {
  switch (typeof value) {
    case 'string':
      if (!hasLetter(value)) return { borderWidth: `${value}px` }
    case 'number':
      return { borderWidth: `${value}px` }
  }
})

translators.translate('display', function (value: string) {
  return { display: value }
})

translators.translate('fontFamily', function (value: string) {
  return { fontFamily: value }
})

translators.translate(
  'fontSize',
  function (value: string | number, { viewport }) {
    switch (typeof value) {
      case 'string':
        if (!hasLetter(value)) {
          if (VP.isNoodlUnit(value)) {
            if (u.isNum(viewport.height)) {
              return { fontSize: String(VP.getSize(value, viewport.height)) }
            }
            return { fontSize: `${value}px` }
          }
        }
      case 'number':
        return { fontSize: `${value}px` }
    }
  },
)

translators.translate('fontStyle', function (value: string) {
  if (value === 'bold') return { fontWeight: 'bold' }
})

translators.translate('textAlign', function (value: nt.StyleTextAlign) {
  if (u.isStr(value)) {
    switch (value) {
      case 'center':
      case 'centerX':
        return { textAlign: 'center' }
      case 'centerY':
        return { display: 'flex', alignItems: 'center' }
      case 'left':
        return { textAlign: 'left' }
      case 'right':
        return { textAlign: 'right' }
    }
  } else if (u.isObj(value)) {
    const styles = {} as Record<string, any>

    if (value.x != undefined) {
      styles.textAlign = value.x === 'centerX' ? 'center' : value.x
    }

    if (value.y != undefined) {
      if (value.y === 'center' || value.y === 'centerY') {
      }
      // Convert (left ,center ,right) to (flex-start | flex-end | center)
      u.assign(styles, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: new Map([
          ['left', 'flex-start'],
          ['right', 'flex-end'],
          ['center', 'center'],
        ]).get(value.x ? value.x : 'left'),
      })
    }

    return styles
  }
})

const button = {
  type: 'button',
  text: 'hello',
  style: {
    textAlign: {
      x: 'right',
      y: 'center',
    },
    border: {
      style: '2',
    },
    shadow: true,
  },
}

translators.execute({ component: button })

export default translators
