import _ from 'lodash'
import { ResolverFn } from '../types'
import { eventTypes } from '../constants'

/** Transforms the event property (ex: onClick, onHover, etc) */
const getEventHandlers: ResolverFn = (component, options) => {
  if (component) {
    const { createActionChain } = options
    _.forEach(eventTypes, (eventType) => {
      const action = component.original?.eventType
      if (action) {
        
        console.log(component.toJS())
        component.set(
          eventType,
          createActionChain(action, { trigger: eventType, component }),
        )
      č
    })
  }
}

export default getEventHandlers
