import { eventTypes } from 'noodl-ui'
import { normalizeEventName } from '../utils'
import { NOODLDOMDataValueElement, RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] events',
  cond: (n, c) => !!(n && c),
  resolve: (node: NOODLDOMDataValueElement, component) => {
    eventTypes.forEach((eventType: string) => {
      if (typeof component.get(eventType) === 'function') {
        node.addEventListener(
          normalizeEventName(eventType),
          component.get(eventType),
        )
      }
    })
  },
} as RegisterOptions
