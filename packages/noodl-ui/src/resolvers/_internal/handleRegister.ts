import { AnyFn, ComponentInstance, ConsumerOptions } from '../../types'
import { _resolveChildren } from './helpers'
import { callAll } from '../../utils/common'

const handleRegister = async (
  component: ComponentInstance,
  options: ConsumerOptions,
) => {
  const id = component.id
  const prop = 'onEvent'
  const eventName = component?.original?.onEvent

  if (options.getCbs('register')?.[id]?.[prop]?.[eventName]) {
    let cbs = (options?.getCbs?.('register')?.[id]?.[prop]?.[eventName] ||
      []) as AnyFn[]

    if (!Array.isArray(cbs)) cbs = []

    /**
     * There are two flows for register components
     *
     *  1. emit.
     *    Components that have an "emit" callback will store "emit" actions that
     *    are registered to the store via noodlui.use({...}), and will call
     *    them when using noodlui.emit(eventName)
     *
     *  2. actions
     *    Components that have an "actions" array will create an action chain
     *    with its actions and will be stored as a callback. This action chain is also
     *    called when using noodlui.emit(eventName)
     */

    // REMINDER: the fn is called by noodlui.emit()

    // When a register component has an "emit", the handler is created in noodl-ui
    // If the component does not have an emit but an "actions", an action chain is
    // created, waiting to be called by noodlui.emit() from functions registered
    // through the store
    options.register({
      component,
      key: component.id,
      prop: 'onEvent',
      fn: (arg) => {
        callAll(...cbs)(arg)
      },
    })
  }
}

export default handleRegister
