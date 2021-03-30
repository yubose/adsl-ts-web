import { isActionChain } from 'noodl-action-chain'
import { userEvent } from 'noodl-types'
import { normalizeEventName } from '../utils'
import { NOODLDOMDataValueElement, RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] events',
  cond: (n, c) => !!(n && c),
  resolve: (node: NOODLDOMDataValueElement, component) => {
    userEvent.forEach((eventType: string) => {
      if (isActionChain(component.get(eventType))) {
        // Putting a setTimeout here helps to avoid the race condition in where
        // the emitted action handlers are being called before local root object
        // gets their data values updated.
        const fn = component.get(eventType)
        // TODO - Unit test + think of a better solution
        node.addEventListener(
          normalizeEventName(eventType),
          (e) => {
            setTimeout(() => Promise.resolve(fn.execute?.(e)))
          },
          { passive: true },
        )
      }
    })
  },
} as RegisterOptions
