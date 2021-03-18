import { RegisterOptions } from '../../types'
import { addClassName } from '../../utils'

function hide(node: HTMLElement) {
  // node && !isHidden(node) && (node.)
}

function isHidden(node: HTMLElement) {
  return !!(node && node.classList.contains('hidden'))
}

export default {
  name: 'popUp',
  cond: 'popUp',
  resolve(node: HTMLElement, component) {
    if (component.has('global')) {
      const image = component.get('image')
      const onClick = component.get('onClick')
    }
  },
} as RegisterOptions
