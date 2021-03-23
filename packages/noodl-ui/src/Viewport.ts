import { IViewport, ViewportListener } from './types'
import { hasLetter, hasDecimal, isBrowser } from './utils/common'
import { isStr, isNum, isNil, isUnd } from './utils/internal'

// const getLineSpacing = (v: number) => v * 1.5
// const getLetterSpacing = (v: number) => v * 0.12
// const getSpacing = (v: number) => v * 2
// const getWordSpacing = (v: number) => v * 0.16

class NOODLViewport implements IViewport {
  #onResize: () => void

  width: number = undefined as any
  height: number = undefined as any

  // TODO - Unit test this
  /**
   * Returns the aspect ratio of size
   * @param { number } vpSize - Viewport size
   * @param { string | number } size
   */
  static getRatio(vpSize: number, size: string | number) {
    if (isStr(size)) {
      if (hasDecimal(size)) return vpSize * Number(size)
      return vpSize / Number(size)
    }
    if (isNum(size)) {
      if (hasDecimal(size)) return vpSize * Number(size)
      return vpSize / Number(size)
    }
    return vpSize
  }

  /**
   *
   * @param { string | number } value - Size in decimals as written in NOODL
   * @param { number } vpSize - The maximum width (or height)
   */
  static getSize(
    value: string | number,
    vpSize: number,
    { toFixed = 2, unit }: { toFixed?: number; unit?: 'px' | 'noodl' } = {},
  ) {
    let result: any

    if (value == '0') {
      result = 0
    } else if (value == '1') {
      result = Number(vpSize)
    } else {
      if (isStr(value)) {
        if (!hasLetter(value)) {
          result = Number(value) * vpSize
        } else {
          result = value.replace(/[a-zA-Z]+/gi, '')
        }
      } else if (isNum(value)) {
        if (hasDecimal(value)) {
          result = value * vpSize
        } else {
          result = value
        }
        result = value * vpSize
      }
    }

    if (isNil(result)) return result

    switch (unit) {
      case 'noodl':
        return (Number(result) / vpSize).toFixed(toFixed)
      case 'px':
        return `${Number(result).toFixed(toFixed)}px`
      default:
        return Number(result).toFixed(toFixed)
    }
  }

  static isNil(v: unknown): v is null | undefined | '' | 'auto' {
    return v === null || isUnd(v) || v === 'auto' || v === ''
  }

  static isNoodlUnit(v: unknown): v is string {
    return isStr(v) && !/[a-zA-Z]/i.test(v)
  }

  static toNum(s: unknown) {
    return Number(String(s).replace(/[a-zA-Z]/gi, ''))
  }

  constructor({ width, height }: { width?: number; height?: number } = {}) {
    this.width = width as number
    this.height = height as number
  }

  isValid() {
    return this.width !== null && this.height !== null
  }

  get onResize() {
    return this.#onResize
  }

  set onResize(callback: ViewportListener) {
    if (isBrowser()) {
      window.removeEventListener('resize', this.#onResize)

      this.#onResize = () => {
        const previousWidth = this.width
        const previousHeight = this.height
        this.width = document.body.clientWidth
        this.height = document.body.clientHeight

        callback({
          width: this.width,
          height: this.height,
          previousWidth,
          previousHeight,
        })
      }

      const onUnload = (e: Event) => {
        window.removeEventListener('resize', this.#onResize)
        window.removeEventListener('unload', onUnload)
      }

      if (typeof window !== 'undefined') {
        window.addEventListener('resize', this.#onResize)
        window.addEventListener('unload', onUnload)
      }
    }
  }

  getWidth(dec: string, opts?: Parameters<typeof NOODLViewport['getSize']>[2]) {
    return NOODLViewport.getSize(dec, this.width as number, opts)
  }

  getHeight(
    dec: string,
    opts?: Parameters<typeof NOODLViewport['getSize']>[2],
  ) {
    return NOODLViewport.getSize(dec, this.height as number, opts)
  }
}

export default NOODLViewport
