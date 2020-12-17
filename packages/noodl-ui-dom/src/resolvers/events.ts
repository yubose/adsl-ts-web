import { eventTypes } from 'noodl-ui'
import { normalizeEventName } from '../utils'
import { NOODLDOMDataValueElement, RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] events',
  cond: Boolean,
  resolve: (node: NOODLDOMDataValueElement, component) => {
    eventTypes.forEach((eventType: string) => {
      if (typeof component.get(eventType) === 'function') {
        node.addEventListener(normalizeEventName(eventType), (e) =>
          component.get(eventType)(e),
        )
      }
    })
  },
} as RegisterOptions
