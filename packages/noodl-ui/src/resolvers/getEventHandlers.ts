import _ from 'lodash'
import Logger from 'logsnap'
import { ResolverFn } from '../types'
import { eventTypes } from '../constants'

const log = Logger.create('getEventHandlers')

/** Transforms the event property (ex: onClick, onHover, etc) */
const getEventHandlers: ResolverFn = (component, options) => {
  if (component) {
    const { createActionChainHandler } = options
    _.forEach(eventTypes, (eventType) => {
      const action = component.action?.[eventType]

      if (action) {
        if (_.isFunction(action)) {
          log.red('createActionChainHandler', {
            action,
            component,
            options,
            eventType,
            eventTypes,
          })
        }
        component.set(
          eventType,
          createActionChainHandler(action, { trigger: eventType, component }),
        )
      }
    })
  }
}

export default getEventHandlers
