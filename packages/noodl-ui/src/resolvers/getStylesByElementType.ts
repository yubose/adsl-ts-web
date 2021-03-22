import Viewport from '../Viewport'
import { ResolverFn } from '../types'

/** Returns styles using the className if found from the baseCss object */
const getStylesByElementType: ResolverFn = (component, options) => {
  // TODO internal state implementation
  switch (component?.noodlType || component?.type) {
    case 'header':
      return void component.setStyle('zIndex', 100)
    case 'image': {
      if (!('height' in (component.original.style || {}))) {
        // Remove the height to maintain the aspect ratio since images are
        // assumed to have an object-fit of 'contain'
        component.removeStyle('height')
      }

      if (!('width' in (component.original.style || {}))) {
        // Remove the width to maintain the aspect ratio since images are
        // assumed to have an object-fit of 'contain'
        component.removeStyle('width')
      }
      return void component.setStyle('objectFit', 'contain')
    }
    case 'video':
      return void component.setStyle('objectFit', 'contain')
    case 'list':
      component
        .setStyle('overflowX', 'hidden')
        .setStyle('listStyle', 'none')
        .setStyle('padding', '0px')
        .setStyle(
          'display',
          component.original.style?.axis === 'horizontal' ? 'flex' : 'block',
        )
      return void component.setStyle('overflowY', 'auto')
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
      return void component
        .setStyle('listStyle', 'none')
        .setStyle('padding', 0)
        .setStyle('position', 'absolute')
    }
    // Defaults to being hidden
    case 'popUp':
      return void component.setStyle('visibility', 'hidden')
    case 'scrollView':
      return void component.assignStyles({
        display: 'block',
        // maxHeight: String(
        //   Viewport.getSize(
        //     component.getStyle('height'),
        //     options.viewport.height as number,
        //   ),
        // ),
      })
    case 'textView':
      return void component.setStyle('rows', 10)
    default:
      return
  }
}

export default getStylesByElementType
