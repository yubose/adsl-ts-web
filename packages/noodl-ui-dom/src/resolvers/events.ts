import * as u from '@jsmanifest/utils'
import { userEvent } from 'noodl-types'
import { normalizeEventName } from '../utils'
import { NOODLDOMDataValueElement, RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] events',
  cond: (n, c) => !!(n && c),
  resolve: (node: NOODLDOMDataValueElement, component) => {
    userEvent.forEach((eventType: string) => {
      if (u.isFnc(component.get?.(eventType)?.execute)) {
        // Putting a setTimeout here helps to avoid the race condition in where
        // the emitted action handlers are being called before local root object
        // gets their data values updated.
        // TODO - Unit test + think of a better solution
        const evtKey = normalizeEventName(eventType)
        node.addEventListener(evtKey, function onEvent(e) {
          setTimeout(() => component.get(eventType).execute?.(e))
        })
      }
    })
  },
} as RegisterOptions
