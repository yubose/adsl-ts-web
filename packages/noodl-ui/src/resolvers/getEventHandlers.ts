import { ResolverFn } from '../types'
import { eventTypes } from '../constants'

/** Transforms the event property (ex: onClick, onHover, etc) */
const getEventHandlers: ResolverFn = (component, options) => {
  if (component) {
    const { createActionChainHandler } = options
    eventTypes.forEach((eventType) => {
      if (component.keys.includes(eventType)) {
        const actionObj = component.get('cache')?.[eventType]

        if (actionObj) {
          // if (!component.action[eventType]) {
          const handler = createActionChainHandler(actionObj, {
            trigger: eventType,
          })
          component.set(eventType, handler)
          // component.action[eventType] = handler
        }
      }
    })
  }
}

export default getEventHandlers
