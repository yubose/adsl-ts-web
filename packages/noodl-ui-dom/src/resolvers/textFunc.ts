import * as u from '@jsmanifest/utils'
import add from 'date-fns/add'
import startOfDay from 'date-fns/startOfDay'
import { NUIComponent } from 'noodl-ui'
import { RegisterOptions } from '../types'
import { eventId } from '../constants'
import Timer from '../global/Timer'
import Timers from '../global/Timers'

export default (function () {
  function registerTimer({
    node,
    component,
    initialValue,
    pageName,
    onClear,
  }: {
    node: HTMLElement
    component: NUIComponent.Instance
    initialValue?: any
    pageName: string
    onClear?(): void
  }) {
    const dataKey = component.get('dataKey')
    timers[component.id] = {
      id: component.id,
      pageName,
      dataKey,
      start() {
        timers[component.id].ref = setInterval(() => {
          component.emit('timer:interval', {
            node,
            component,
          })
        }, 1000)
      },
      current: initialValue || startOfDay(new Date()),
      ref: undefined,
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
        console.log(`%cCleared timer`, `color:#c4a901;`, timers[component.id])
        for (const id of Object.keys(timers)) {
          clearInterval(timers[id]?.ref)
          // delete timers[id]
        }

        onClear?.()
      },
    }
    return timers[component.id]
  }

  return {
    name: '[noodl-ui-dom] text=func',
    cond: (n, c) => c.has('text=func'),
    before: (n, c, { global }) => {
      if (typeof window === 'undefined') return
      if (!window['timers']) window['timers'] = global.timers
    },
    resolve: (node: HTMLElement, component, { global, page, ndom }) => {
      if (component.contentType === 'timer') {
        const dataKey = component.blueprint?.dataKey as string

        if (global.timers.has(dataKey)) {
          const timer = global.timers.get(dataKey)
          console.log(
            `%cFound existing timer object for dataKey "${dataKey}"`,
            `color:#c4a901;`,
            { component, timer },
          )
          const currentValue = timer?.value
          // global.timers.remove(timer)

          // component.emit('timer:init', (initialTime: Date) => {
          //   global.timers[component.id] = registerTimer({
          //     node,
          //     component,
          //     // TODO
          //     initialValue: currentValue,
          //     pageName: page.page,
          //     onClear() {
          //       ndom.page.off(
          //         eventId.page.on.ON_DOM_CLEANUP,
          //         global.timers[component.id]?.clear,
          //       )
          //     },
          //   })

          //   ndom.page.on(
          //     eventId.page.on.ON_DOM_CLEANUP,
          //     global.timers[component.id]?.clear,
          //   )

          //   component.emit('timer:ref', global.timers[component.id])
          // })
        } else {
          // TODO - Refactor a better way to get the initial value since the
          // call order isn't guaranteed
          setTimeout(() => {
            component.emit('timer:init', (initialValue?: Date) => {
              console.log(`%cStarting new timer instance`, `color:#c4a901;`, {
                initialValue,
              })
              const timer = global.timers.set(dataKey, {
                initialValue: initialValue || startOfDay(new Date()),
                pageName: page.page,
              })

              timer.on('increment', (value) => {
                component.emit('timer:interval', { value, node, component })
              })

              component.emit('timer:ref', timer)

              ndom.page.on(eventId.page.on.ON_DOM_CLEANUP, () => {
                global.timers.remove(timer)
              })
            })
          }, 300)
        }
      } else {
        node && (node.textContent = component.get('data-value') || '')
      }
    },
  } as RegisterOptions
})()
