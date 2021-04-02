import Component from '../components/Base'

function isComponent(component: unknown): component is Component {
  return Component.isComponent(component)
}

export default isComponent
