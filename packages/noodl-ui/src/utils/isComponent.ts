import Component from '../components/Base'
import { ComponentInstance } from '../types'

function isComponent(component: unknown): component is ComponentInstance {
  return Component.isComponent(component)
}

export default isComponent
