import isComponent from './isComponent'
import * as t from '../types'

function visit(
  component: t.NuiComponent.Instance,
  cb: (component: t.NuiComponent.Instance) => void,
) {
  if (isComponent(component)) {
    cb(component)
    for (const child of component.children) {
      visit(child, cb)
    }
  }
}

export default visit
