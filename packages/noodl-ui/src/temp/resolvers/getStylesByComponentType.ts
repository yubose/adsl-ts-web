import { ComponentObject } from 'noodl-types'

/**
 * Resolves a component's html tag name by evaluating the NOODL "type" property
 */
export default {
  name: 'getStylesByComponentType',
  resolve(component: ComponentObject) {
    if (!component) return
    if (!component.style) component.style = {}

    switch (component?.noodlType) {
      case 'header':
        return void (component.style.zIndex = 100)
      case 'image': {
        if (!('height' in (component.style || {}))) {
          // Remove the height to maintain the aspect ratio since images are
          // assumed to have an object-fit of 'contain'
          delete component.style.height
        }

        if (!('width' in (component.style || {}))) {
          // Remove the width to maintain the aspect ratio since images are
          // assumed to have an object-fit of 'contain'
          delete component.style.width
        }
        return void (component.style.objectFit = 'contain')
      }
      case 'video':
        return void (component.style.objectFit = 'contain')
      case 'list':
        return void Object.assign(component.style, {
          overflowX: 'hidden',
          overflowY: 'auto',
          listStyle: 'none',
          padding: '0x',
          display: component.style.axis === 'horizontal' ? 'flex' : 'block',
        })
      // Flipping the position to relative to make the list items stack on top of eachother.
      //    Since the container is a type: list and already has their entire height defined in absolute values,
      //    this shouldn't have any UI issues because they'll stay contained within
      case 'listItem': {
        return void Object.assign(component.style, {
          listStyle: 'none',
          padding: 0,
          position: 'relative',
        })
      }
      // Defaults to being hidden
      case 'popUp':
        return void (component.style.visibility = 'hidden')
      case 'textView':
        return void (component.style.rows = 10)
      default:
        return
    }
  },
}
