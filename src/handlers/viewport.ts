import Logger from 'logsnap'
import { Viewport, ViewportListener } from 'noodl-ui'
import { getAspectRatio } from '../utils/common'
import getViewportSizeWithMinMax from '../utils/getViewportSizeWithMinMax'

const createViewportHandler = function (viewport: Viewport) {
  let min: number
  let max: number
  const log = Logger.create('createViewportHandler')
  const fns = [] as Function[]

  const o = {
    computeViewportSize({
      width,
      height,
      previousWidth,
      previousHeight,
    }: Parameters<ViewportListener>[0]) {
      const aspectRatio = getAspectRatio(width, height)
      if (typeof min === 'number' && typeof max === 'number') {
        const newSizes = getViewportSizeWithMinMax({
          width,
          height,
          aspectRatio,
          min,
          max,
        })
        width = newSizes.width
        height = newSizes.height
      }
      return {
        width,
        height,
        previousWidth,
        previousHeight,
        aspectRatio,
        min,
        max,
      }
    },
    getCurrentAspectRatio() {
      return getAspectRatio(viewport.width as number, viewport.height as number)
    },
    getMinMaxRatio() {
      return { min, max }
    },
    isConstrained() {
      if (typeof min === 'number' && typeof max === 'number') {
        const aspectRatio = o.getCurrentAspectRatio()
        return aspectRatio <= min || aspectRatio >= max
      }
    },
    on(ev: string, fn: Function) {
      if (ev === 'resize') fns.push(fn as Viewport['onResize'])
      return o
    },
    setMinAspectRatio(value: number) {
      min = Number(value)
      return this
    },
    setMaxAspectRatio(value: number) {
      max = Number(value)
      return this
    },
    setViewportSize({ width, height }: { width: number; height: number }) {
      viewport.width = width
      viewport.height = height
      return o
    },
  }

  /**
   * This manages viewport aspect ratios for the SDK whenever it changes.
   * This affects the endpoints that the SDK uses to load pages
   */
  viewport.onResize = async function (args) {
    log.func('onResize')
    const { width, height, previousWidth, previousHeight } = args
    if (width !== previousWidth || height !== previousHeight) {
      console.log('Viewport changed', args)
      const results = o.computeViewportSize(args)
      o.setViewportSize(results)
      // if (aspectRatio > 1 !== cache['landscape']) {
      //   cache['landscape'] = !cache.landscape
      //   callCount++
      //   await page.requestPageChange(page.currentPage, { force: true })
      // } else {
      // }
      fns.forEach((fn) => fn(results))
    }
  }

  return { viewport, ...o }
}

export default createViewportHandler
