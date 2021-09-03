import * as nt from 'noodl-types'
import { LiteralUnion } from 'type-fest'
import { NUIComponent } from 'noodl-ui'
import xs from 'xstate'

const machine = xs.createMachine({
  id: 'redraw',
  initial: 'init',
  states: {
    init: {
      on: {
        TYPE: {},
      },
    },
    resolved: {
      type: 'final',
    },
    rejected: {
      type: 'final',
    },
  },
})

const service = xs.interpret(machine).onTransition((state) => {
  console.info(`[xs:onTransition]`, state)
})

service.start()

console.log(service)

export const ON_START = 'ON_START'

export const ON_END = 'ON_END'

export interface RedrawState {
  current: {
    type: LiteralUnion<nt.ComponentType, string>
    id: string
  } | null
  hooks: {}
  queue: {
    type: LiteralUnion<nt.ComponentType, string>
    id: string
  }[]
}

class Redraw {
  #state = {
    current: null,
    hooks: {},
    queue: [],
  } as RedrawState

  constructor(component: NUIComponent.Instance) {
    this.#component = component
  }

  run() {
    //
  }

  get current() {
    return this.#state.current
  }

  get queue() {
    return this.#state.queue
  }
}

const createRedrawFactory = (function () {
  return function () {
    //
  }
})()

export default createRedrawFactory
