import { Viewport as VP } from 'noodl-ui'

export interface GetViewportSizeWithMinMaxArgs {
  width: number
  height: number
  min: string | number
  max: string | number
  aspectRatio: number
}

// Should be attached to window.addEventListener('resize', ...)
export function getViewportSizeWithMinMax({
  width,
  height,
  min,
  max,
  aspectRatio = VP.getAspectRatio(Number(width), Number(height)),
}: GetViewportSizeWithMinMaxArgs) {
  min = Number(min)
  max = Number(max)

  if (aspectRatio < min) {
    width = min * height
  } else if (aspectRatio > max) {
    width = max * height
  }

  return { width, height }
}

const createViewportHandler = function (viewport: VP) {
  let min: number
  let max: number
  const fns = [] as Function[]

  const o = {
    computeViewportSize({
      width,
      height,
      previousWidth,
      previousHeight,
    }: Parameters<
      (
        viewport: { width: number; height: number } & {
          previousWidth: number | undefined
          previousHeight: number | undefined
        },
      ) => Promise<any> | any
    >[0]) {
      const aspectRatio = VP.getAspectRatio(width, height)
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
      return VP.getAspectRatio(viewport.width, viewport.height)
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
      if (ev === 'resize') fns.push(fn as VP['onResize'])
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
    const { width, height, previousWidth, previousHeight } = args
    if (width !== previousWidth || height !== previousHeight) {
      const results = o.computeViewportSize(args)
      o.setViewportSize(results)
      fns.forEach((fn) => fn(results))
    }
  }

  return { viewport, ...o }
}

export default createViewportHandler
