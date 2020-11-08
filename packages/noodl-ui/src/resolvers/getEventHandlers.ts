import _ from 'lodash'
import { ResolverFn } from '../types'
import { eventTypes } from '../constants'

/** Transforms the event property (ex: onClick, onHover, etc) */
const getEventHandlers: ResolverFn = (component, options) => {
  if (component) {
    const { createActionChainHandler } = options
    _.forEach(eventTypes, (eventType) => {
      const action = component.original?.[eventType]
      if (action) {
        component.set(
          eventType,
          createActionChainHandler(action, { trigger: eventType, component }),
        )
      }
    })
  }
}

export default getEventHandlers
