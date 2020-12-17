import { RegisterOptions } from '../types'
import { isTextFieldLike } from '../utils'

export default {
  name: '[noodl-ui-dom] data values in non-textfield-like components',
  cond: (node) => !!node && !isTextFieldLike(node),
  resolve: (node, component) => {
    let { children, placeholder, text } = component.get([
      'children',
      'placeholder',
      'text',
    ])
    text = component.get('data-value') || text || ''
    if (!text && children) text = `${children}` || ''
    if (!text && placeholder) text = placeholder
    if (!text) text = ''
    if (text && node) node.innerHTML = `${text}`
  },
  // if (node && !node.innerHTML.trim()) {
  //   if (isDisplayable(component.get('data-value'))) {
  //     node.innerHTML = `${component.get('data-value')}`
  //   } else if (isDisplayable(component.get('children'))) {
  //     node.innerHTML = `${component.get('children')}`
  //   } else if (isDisplayable(component.get('text'))) {
  //     node.innerHTML = `${component.get('text')}`
  //   }
  //   if (text && node) node.innerHTML = text
  // }
} as RegisterOptions
