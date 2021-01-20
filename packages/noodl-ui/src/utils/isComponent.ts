import { ComponentInstance } from '../types'

function isComponent(component: any): component is ComponentInstance {
  return !!(
    component &&
    typeof component !== 'string' &&
    typeof component.children === 'function'
  )
}

export default isComponent
