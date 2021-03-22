import Viewport from '../../Viewport'
import {
  hasDecimal as hasDec,
  hasLetter as hasLetter,
} from '../../utils/common'
import { assign, isStr, isObj, isNum, isNil, isUnd } from '../../utils/internal'
import { ComponentInstance, ConsumerOptions } from '../../types'

const toNum = (v: any) => Number(String(v).replace(/[a-zA-Z]+/g, ''))

/*
  Should be invoked when components are resolved and are approaching the 
  end of their resolving phase
*/

class StyleFinalizer {
  #viewport: Viewport
  cache = {}
  node: HTMLElement
  first: ComponentInstance | null = null
  last: ComponentInstance | null = null
  lastTop: number = 0

  constructor(viewport: Viewport) {
    this.node = document.createElement('div')
    this.viewport = viewport

    if (typeof window !== 'undefined') {
      window['sfcache'] = this.cache
    }
  }

  set viewport(viewport) {
    this.#viewport = viewport
  }

  get viewport() {
    return this.#viewport
  }

  finalize(component: ComponentInstance, options: ConsumerOptions) {
    if (!component) return

    const { context } = options || {}

    const page = context?.page || ''
    const id = component.id || ''

    const obj = {
      page,
      // component,
      get originalStyle() {
        return component.original?.style
      },
      get style() {
        return component.style
      },
      finalizedStyles: {},
    }

    const style = component.style || {}

    const parent = component.parent
    // const parentTop = unwrap(parent?.style?.top) || this.lastTop
    // const parentLeft = parent?.style?.left || 'auto'

    if (parent) {
      //
    }

    if (!('top' in style) || style.top === '0px' || style.top === 'auto') {
      //
    }

    if (
      !('height' in style) ||
      style.height === '0px' ||
      style.height === 'auto'
    ) {
      let temp = document.createElement('div')
    }

    /* -------------------------------------------------------
      ---- Positioning
    -------------------------------------------------------- */

    const dims = {} as Record<string, any>

    // !isNil(style.top) && (dims.top = unwrap(style.top))
    // !isNil(style.left) && (dims.left = unwrap(style.left))
    // !isNil(style.width) && (dims.width = unwrap(style.width))
    // !isNil(style.height) && (dims.height = unwrap(style.height))

    this.cache[id] = obj

    if ('top' in dims) this.lastTop += dims.top
    if ('height' in dims) this.lastTop += dims.height

    // component.assignStyles(
    //   Object.entries(dims).reduce((acc, [key, v]) => {
    //     if (key === 'top' || key === 'height') {
    //       acc[key] = Viewport.getSize()
    //     } else if (key === 'left' || key === 'width') {
    //       //
    //     }
    //     return acc
    //   }, {}),
    // )
  }

  clear() {
    this.first = null
    this.last = null
    if (this.node) this.node.remove()
    this.node = document.createElement('div')
  }
}

export default StyleFinalizer
