import { NOODLDOMElement, RegisterOptions } from '../types'
import { eventId } from '../constants'

export default (function () {
  const timers = {} as {
    [componentId: string]: {
      ref: NodeJS.Timeout
      current: number
    }
  }

  return {
    name: '[noodl-ui-dom] text=func',
    cond: (n, c) => typeof c.get('text=func') === 'function',
    resolve: (node: NOODLDOMElement, component, { noodluidom }) => {
      if (component.contentType === 'timer') {
        if (!timers[component.id]) {
          const textFunc = component.get('text=func') || ((x: any) => x)

          const obj = {
            current: 0,
            ref: setInterval(() => {
              node && (node.textContent = textFunc(obj.current++))
              component.emit('interval', timers[component.id])
            }, 1000),
            clear: () => {
              clearInterval(obj.ref)
              console.info(`Cleared timer`, obj)
            },
          }

          timers[component.id] = obj

          const clearTimer = () => {
            obj.clear()
            noodluidom.off(eventId.page.on.ON_DOM_CLEANUP, clearTimer)
          }

          noodluidom.on(eventId.page.on.ON_DOM_CLEANUP, clearTimer)

          component.emit('interval', timers[component.id])
        }
      } else {
        node && (node.textContent = component.get('data-value') || '')
      }
    },
  } as RegisterOptions
})()
