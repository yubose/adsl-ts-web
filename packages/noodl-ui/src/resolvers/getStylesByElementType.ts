import _ from 'lodash'
import { Resolver } from '../types'

/**
 * Returns styles using the className if found from the baseCss object
 * @param { Component } component
 * @param { ResolverConsumerOptions } options
 * @return { void }
 */
const getStylesByElementType: Resolver = (component, options) => {
  // TODO internal state implementation
  switch (component?.type) {
    case 'header':
      return void component.setStyle('zIndex', 100)
    case 'image':
      return void component.setStyle('objectFit', 'contain')
    // Flipping the position to relative to make the list items stack on top of eachother.
    //    Since the container is a type: list and already has their entire height defined in absolute values,
    //    this shouldn't have any UI issues because they'll stay contained within
    case 'listItem': {
      if (options['lastTop'] !== undefined) {
        // if (_.isFinite(options._internal?.lastTop)) {
        //   const height = component.style?.height
        //   if (!_.isFinite(height)) {
        //     // @ts-expect-error
        //     draft.style['height'] = Number(height)
        //   }
        //   if (_.isNaN(height)) {
        //     console.log(
        //       `%cReceived NaN as the value of height. This will cause unexpected visual results.`,
        //       'color:#e74c3c;font-weight:bold;',
        //       { height, ...options },
        //     )
        //   }
        //   // @ts-expect-error
        //   options._internal.lastTop += Number(height)
        // } else {
        //   console.log(
        //     `%cTried to update the internal state value of "lastTop" but it was not a number`,
        //     'color:#e74c3c;font-weight:bold;',
        //     options,
        //   )
        // }
      }
      component.setStyle('listStyle', 'none')
      component.setStyle('padding', 0)
      return void component.setStyle('position', 'relative')
    }
    // Defaults to being hidden
    case 'popUp':
      return void component.setStyle('visibility', 'hidden')
    case 'textView':
      return void component.setStyle('rows', 10)
    default:
      return
  }
}

export default getStylesByElementType
