import { RegisterOptions } from '../../types'

export default {
  name: '[noodl-ui-dom] image',
  cond: 'image',
  resolve(node, component) {
    const onClick = component.get('onClick')

    if (typeof onClick === 'function') {
      node.style['cursor'] = 'pointer'
    }

    // If an image has children, we will assume it is some icon button overlapping
    //    Ex: profile photos and showing pencil icon on top to change it
    if (component.original?.children) {
      node.style['width'] = '100%'
      node.style['height'] = '100%'
    }
  },
} as RegisterOptions
