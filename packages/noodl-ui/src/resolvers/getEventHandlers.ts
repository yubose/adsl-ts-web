import _ from 'lodash'
import { Resolver } from '../types'
import { eventTypes } from '../constants'

/**
 * Transforms the event property (ex: onClick, onHover, etc)
 * @param { Component } component
 * @param { ResolverConsumerOptions } options
 * @return { void }
 */
const getEventHandlers: Resolver = (component, options) => {
  if (component) {
    const { createActionChain } = options

    _.forEach(eventTypes, (eventType) => {
      const action = component.get(eventType)
      if (action) {
        component.set(
          eventType,
          createActionChain(action, {
            // needsBlob: component.get('contentType') === 'file',
            trigger: eventType,
          }),
        )
      }
    })
  }
}

export default getEventHandlers
