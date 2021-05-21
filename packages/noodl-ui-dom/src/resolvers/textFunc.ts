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
      component.on('timer:init', (initialValue?: Date) => {
        const timer =
          global.timers.get(dataKey) ||
          global.timers.set(dataKey, {
            initialValue: initialValue || startOfDay(new Date()),
            pageName: page.page,
          })

        if (initialValue && timer.value !== initialValue) {
          timer.value = initialValue
        }

        timer.pageName !== page.page && (timer.pageName = page.page)

        timer.on('increment', (value) => {
          component.emit('timer:interval', value)
        })
        component.emit('timer:ref', timer)

        ndom.page.once(eventId.page.on.ON_DOM_CLEANUP, () => {
          timer.clear()
          timer.onClear = undefined
          timer.onIncrement = undefined
          component.clear('hooks')
        })
      })
    } else {
      node && (node.textContent = component.get('data-value') || '')
    }
  },
} as RegisterOptions
