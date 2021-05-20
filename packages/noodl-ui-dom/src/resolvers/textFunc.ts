import startOfDay from 'date-fns/startOfDay'
import { RegisterOptions } from '../types'
import { eventId } from '../constants'

export default {
  name: '[noodl-ui-dom] text=func',
  cond: (n, c) => c.has('text=func'),
  before: (n, c, { global }) => {
    if (typeof window === 'undefined') return
    if (!window['timers']) window['timers'] = global.timers
  },
  resolve: (node: HTMLElement, component, { global, page, ndom }) => {
    if (component.contentType === 'timer') {
      const dataKey = component.blueprint?.dataKey as string
      // TODO - Refactor a better way to get the initial value since the
      // call order isn't guaranteed
      setTimeout(() => {
        component.emit('timer:init', (initialValue?: Date) => {
          if (global.timers.has(dataKey)) {
            console.log(
              `%cRestarting existing timer for dataKey "${dataKey}"`,
              `color:#c4a901;`,
              component,
            )
            // global.timers.get(dataKey)?.start()
            // setTimeout(() => component.emit('timer:restart'), 300)
          } else {
            console.log(`%cStarting new timer instance`, `color:#c4a901;`, {
              initialValue,
            })
          }

          const timer = global.timers.set(dataKey, {
            initialValue: initialValue || startOfDay(new Date()),
            pageName: page.page,
          })

          timer.on('increment', (value) => {
            component.emit('timer:interval', { value, node, component })
          })

          component.emit('timer:ref', timer)

          ndom.page.once(eventId.page.on.ON_DOM_CLEANUP, () => {
            timer.clear()
            timer.onIncrement = undefined
          })
        })
      }, 300)
    } else {
      node && (node.textContent = component.get('data-value') || '')
    }
  },
} as RegisterOptions
