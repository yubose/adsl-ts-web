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
          const handler = createActionChainHandler(actionObj, {
            trigger: eventType,
          } as any)
          component.set(eventType, handler)
        }
      }
    })
  }
}

export default getEventHandlers
