import _ from 'lodash'
import { ResolverFn } from '../types'
import { eventTypes } from '../constants'

/** Transforms the event property (ex: onClick, onHover, etc) */
const getEventHandlers: ResolverFn = (component, options) => {
  if (component) {
    const { createActionChain } = options
    _.forEach(eventTypes, (eventType) => {
      const action = component.get(eventType)
      if (action) {
        component.set(
          eventType,
          createActionChain(action, { trigger: eventType, component }),
        )
      }
    })
  }
}

export default getEventHandlers
