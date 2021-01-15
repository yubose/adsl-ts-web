import { ComponentObject } from 'noodl-types'

/**
 * Resolves a component's html tag name by evaluating the NOODL "type" property
 */
export default {
  name: 'getEventHandlers',
  resolve(component: ComponentObject) {
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
  },
}
