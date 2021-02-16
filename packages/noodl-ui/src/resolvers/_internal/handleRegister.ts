import Logger from 'logsnap'
import { ComponentInstance, ConsumerOptions } from '../../types'
import { _resolveChildren } from './helpers'

const log = Logger.create('handleRegister')

/*
  twilioOnPeopleJoin
  twilioOnNoParticipant
*/

const handleRegister = async (
  component: ComponentInstance,
  options: ConsumerOptions,
) => {
  const prop = 'onEvent'
  const eventName = component?.original?.onEvent
  let id = eventName || component.id

  if (component.original?.emit) {
    // Register components that call emit are registered slightly different (see below)
    return
  }

  const obj = options.getCbs('register')?.[id]?.[prop]?.[eventName]

  if (obj) {
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
     *    with its actions and will be converted as a callback. This action chain is
     *    called when using noodlui.emit(eventName)
     */

    // REMINDER: the fn is called by noodlui.emit()

    // When a register component has an "emit", the handler is created in noodl-ui
    // If the component does not have an emit but an "actions", an action chain is
    // created, waiting to be called by noodlui.emit() from functions registered
    // through the store
    if (obj.component !== component) {
      obj.component = component
      log.grey(
        `The register component for ${id} was attached to the noodl-ui register object`,
        obj,
      )
    }
  } else {
    // TODO - Check if this becomes a memory leak at this point
    log.orange(
      `No ${prop} callbacks were registered with the name ${id} through the ` +
        `so this component cannot be attached anywhere and will not be in effect`,
      {
        component,
        options,
        registeredCbs: options.getCbs('register'),
      },
    )
  }
}

export default handleRegister
