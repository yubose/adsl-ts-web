import add from 'date-fns/add'
import startOfDay from 'date-fns/startOfDay'
import { NOODLDOMElement, RegisterOptions } from '../types'
import { eventId } from '../constants'
import { ComponentInstance } from 'noodl-ui'

export default (function () {
  const timers = {} as {
    [componentId: string]: {
      start(): void
      current: Date
      ref: null | NodeJS.Timeout
      clear(): void
      increment(): void
      set(value: any): void
    }
  }

  return {
    name: '[noodl-ui-dom] text=func',
    cond: (n, c) => typeof c.get('text=func') === 'function',
    resolve: (node: NOODLDOMElement, component, { noodluidom }) => {
      if (component.contentType === 'timer') {
        setTimeout(() => {
          component.emit('initial.timer', (initialTime: Date) => {
            timers[component.id] = {
              start() {
                timers[component.id].ref = setInterval(() => {
                  component.emit('interval', {
                    node,
                    component,
                    ref: timers[component.id],
                  })
                }, 1000)
              },
              current: initialTime || startOfDay(new Date()),
              ref: null,
              set(value: any) {
                timers[component.id] = value
              },
              increment() {
                if (timers[component.id]) {
                  timers[component.id].current = add(
                    new Date(timers[component.id].current),
                    { seconds: 1 },
                  )
                }
              },
              clear() {
                clearInterval(timers[component.id].ref)
                noodluidom.off(
                  eventId.page.on.ON_DOM_CLEANUP,
                  timers[component.id]?.clear,
                )
                console.info(`Cleared timer`, timers[component.id])
              },
            }

            noodluidom.on(
              eventId.page.on.ON_DOM_CLEANUP,
              timers[component.id]?.clear,
            )

            component.emit('timer.ref', timers[component.id])
          })
        }, 500)
      } else {
        node && (node.textContent = component.get('data-value') || '')
      }
    },
  } as RegisterOptions
})()
