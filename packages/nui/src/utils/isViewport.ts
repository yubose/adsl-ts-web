import NuiViewport from '../Viewport'

function isNuiViewport(value: any): value is NuiViewport {
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

export default isNuiViewport
