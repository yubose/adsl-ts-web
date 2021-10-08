import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
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
