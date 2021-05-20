import add from 'date-fns/add'
import startOfDay from 'date-fns/startOfDay'
import { Identify } from 'noodl-types'
import { RegisterOptions } from '../types'
import { eventId } from '../constants'

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
    cond: (n, c) => c.has('text=func'),
    resolve: (node: HTMLElement, component, { ndom }) => {
      if (component.contentType === 'timer') {
        setTimeout(() => {
          component.emit('timer:init', (initialTime: Date) => {
            timers[component.id] = {
              start() {
                timers[component.id].ref = setInterval(() => {
                  component.emit('timer:interval', {
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
                ndom.page.off(
                  eventId.page.on.ON_DOM_CLEANUP,
                  timers[component.id]?.clear,
                )
                console.log(`Cleared timer`, timers[component.id])
              },
            }

            ndom.page.on(
              eventId.page.on.ON_DOM_CLEANUP,
              timers[component.id]?.clear,
            )

            component.emit('timer:ref', timers[component.id])
          })
        }, 500)
      } else {
        node && (node.textContent = component.get('data-value') || '')
      }
    },
  } as RegisterOptions
})()
