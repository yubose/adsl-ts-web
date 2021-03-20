import { userEvent } from 'noodl-types'
import { ResolverFn } from '../types'

/** Transforms the event property (ex: onClick, onHover, etc) */
const getEventHandlers: ResolverFn = (component, options) => {
  if (component) {
    const { createActionChainHandler } = options
    userEvent.forEach((eventType) => {
      if (component.has(eventType)) {
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
