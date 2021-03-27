import { Viewport as VP } from 'noodl-ui'

export interface GetViewportSizeWithMinMaxArgs {
  width: number
  height: number
  min: string | number
  max: string | number
  aspectRatio: number
}

// Should be attached to window.addEventListener('resize', ...)
function getViewportSizeWithMinMax({
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

export default getViewportSizeWithMinMax
