import { isActionChain } from 'noodl-action-chain'
import { userEvent } from 'noodl-types'
import { normalizeEventName } from '../utils'
import { NOODLDOMDataValueElement, RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] events',
  cond: (n, c) => !!(n && c),
  resolve: (node: NOODLDOMDataValueElement, component) => {
    userEvent.forEach((eventType: string) => {
      if (typeof component.get?.(eventType)?.execute === 'function') {
        // Putting a setTimeout here helps to avoid the race condition in where
        // the emitted action handlers are being called before local root object
        // gets their data values updated.
        // TODO - Unit test + think of a better solution
        const evtKey = normalizeEventName(eventType)
        node.addEventListener(evtKey, function onEvent(e) {
          setTimeout(() => component.get(eventType).execute?.(e))
        })
        //
        // if (!global.evts.has(node.id, evtKey)) {
        //   global.evts.get(node.id, evtKey)?.push?.(handler)
        //   console.log(
        //     `%c[${evtKey}] Added event listener "${evtKey}" to events cache`,
        //     `color:#00b406;`,
        //     {
        //       elemId: node.id,
        //       evtKey,
        //       evtItems: global.evts.get(node.id, evtKey),
        //     },
        //   )
        //   node.addEventListener(evtKey, handler)
        // }
      }
    })
  },
} as RegisterOptions
