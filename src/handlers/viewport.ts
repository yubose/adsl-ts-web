import Logger from 'logsnap'
import { Viewport, ViewportListener } from 'noodl-ui'
import { getAspectRatio } from '../utils/common'
import getViewportSizeWithMinMax from '../utils/getViewportSizeWithMinMax'

const createViewportHandler = function (viewport: Viewport) {
  let min: number
  let max: number
  const log = Logger.create('createViewportHandler')
  const fns = [] as Function[]

  let cache = {
    landscape: true,
  }

  const o = {
    computeViewportSize({
      width,
      height,
      previousWidth,
      previousHeight,
    }: Parameters<ViewportListener>[0]) {
      const aspectRatio = getAspectRatio(width, height)
      if (min && max) {
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
      }
    },
    getCurrentAspectRatio() {
      return getAspectRatio(viewport.width as number, viewport.height as number)
    },
    updateViewport({ width, height }: { width: number; height: number }) {
      viewport.width = width
      viewport.height = height
      // Setting these styles on the body elemenet helps the scrolling effect
      // to behave expectedly
      document.body.style.width = width + 'px'
      document.body.style.height = height + 'px'
      document.body.style.position = 'relative'
      if (o.getCurrentAspectRatio() > 1) {
        document.body.style.margin = 'auto'
        document.body.style.overflowX = 'hidden'
      } else {
        document.body.style.margin = 'undefined'
        document.body.style.overflowX = 'auto'
      }

      return o
    },
    on(ev: string, fn: Function) {
      if (ev === 'resize') {
        fns.push(fn as Viewport['onResize'])
      }
      return o
    },
    getMinMaxRatio() {
      return { min, max }
    },
    setMinAspectRatio(value: number) {
      min = Number(value)
      return this
    },
    setMaxAspectRatio(value: number) {
      max = Number(value)
      return this
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
      const results = o.computeViewportSize(args)
      const { width, height } = results
      o.updateViewport({ width, height })
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
