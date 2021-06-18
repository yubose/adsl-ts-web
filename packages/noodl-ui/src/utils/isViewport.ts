import Viewport from '../Viewport'

function isViewport(value: any): value is Viewport {
  if (
    value &&
    typeof value === 'object' &&
    'isNoodlUnit' in value &&
    'applyMinMax' in value
  ) {
    return true
  }
  return false
}

export default isViewport
