import isNaN from 'lodash/isNaN'
import { hasLetter, hasDecimal, isBrowser } from './utils/common'
import { isStr, isNum, isNil, isUnd } from './utils/internal'

interface GetSizeOptions<U extends 'px' | 'noodl' = 'px' | 'noodl'> {
  toFixed?: number
  unit?: U
}

class NOODLViewport {
  #onResize: () => void

  width: number = undefined as any
  height: number = undefined as any

  static getAspectRatio(width: number, height: number) {
    /**
     * The binary Great Common Divisor calculator
     * https://stackoverflow.com/questions/1186414/whats-the-algorithm-to-calculate-aspect-ratio
     * @param { number } u - Upper
     * @param { number } v - Lower
     */
    const getGCD = (u: number, v: number): any => {
      if (u === v) return u
      if (u === 0) return v
      if (v === 0) return u
      if (~u & 1)
        if (v & 1) return getGCD(u >> 1, v)
        else return getGCD(u >> 1, v >> 1) << 1
      if (~v & 1) return getGCD(u, v >> 1)
      if (u > v) return getGCD((u - v) >> 1, v)
      return getGCD((v - u) >> 1, u)
    }

    const getSizes = (w: number, h: number) => {
      const d = getGCD(w, h)
      return [w / d, h / d]
    }

    const [newWidth, newHeight] = getSizes(width, height)
    const aspectRatio = newWidth / newHeight
    return aspectRatio
  }

  /**
   * Returns the computed size.
   * @param { string | number } value - Size in decimals as written in NOODL
   * @param { number } vpSize - The maximum width (or height)
   */
  static getSize(
    value: string | number,
    vpSize: number,
    opts: GetSizeOptions,
  ): string

  static getSize(
    value: string | number,
    vpSize: number,
    opts: Omit<GetSizeOptions, 'unit'>,
  ): number

  static getSize(
    value: string | number,
    vpSize: number,
    { toFixed = 2, unit }: GetSizeOptions = {},
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
      // NOODL
      case 'noodl':
        return (Number(result) / vpSize).toFixed(toFixed)
      // Transformed
      case 'px':
        return `${Number(result).toFixed(toFixed)}px`
      default:
        // TODO - Wrap to coerce to number type
        return Number(result).toFixed(toFixed)
    }
  }

  /**
   * Returns true if the value is considered an "invalid" data value to set on
   * a viewport's dimensions. This is mostly intended to trigger the auto-top
   * concept. Invalid values are: null, undefined, '', 'auto
   * @param { unknown } value
   */
  static isNil(v: unknown): v is null | undefined | '' | 'auto' {
    return v === null || isUnd(v) || v === 'auto' || v === ''
  }

  /**
   * Returns true if the value is a NOODL value that the Viewport will treat as
   * "not yet transformed/parsed". The Viewport sees a NOODL value as a value
   * that is a string, does not have any letters, and is coercible to a number
   * @param { unknown } value
   */
  static isNoodlUnit(v: unknown): v is string {
    return isStr(v) && !/[a-zA-Z]/i.test(v) && !isNaN(Number(v))
  }

  /** https://tc39.es/ecma262/#sec-tonumber */
  static toNum(v: unknown) {
    if (isNum(v)) return v
    else if (isStr(v)) return Number(v.replace(/[a-zA-Z]/gi, ''))
    return Number(String(v))
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

  set onResize(
    callback: (
      viewport: { width: number; height: number } & {
        previousWidth: number | undefined
        previousHeight: number | undefined
      },
    ) => Promise<any> | any,
  ) {
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
    return NOODLViewport.getSize(dec, this.width, opts)
  }

  getHeight(
    dec: string,
    opts?: Parameters<typeof NOODLViewport['getSize']>[2],
  ) {
    return NOODLViewport.getSize(dec, this.height, opts)
  }
}

export default NOODLViewport
