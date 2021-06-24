import { NUIComponent } from '../types'

function isComponent(component: unknown): component is NUIComponent.Instance {
  return typeof component === 'object' && 'blueprint' in (component || {})
}

export default isComponent
