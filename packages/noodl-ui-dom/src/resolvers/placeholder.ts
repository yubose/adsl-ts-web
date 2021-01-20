import { isEmitObj } from 'noodl-utils'
import { RegisterOptions } from '../types'

export default {
  name: '[noodl-ui-dom] placeholder',
  cond: (node, component) =>
    !!(node && component.get('placeholder') != undefined),
  resolve: (node: HTMLInputElement, component) => {
    const placeholder = component.get('placeholder') || ''

    if (isEmitObj(placeholder)) {
      component.on('placeholder', (result) => {
        setTimeout(() => {
          node.placeholder = result
        })
        console.log(
          `%cPLACEHOLDER RESULT`,
          `color:#4E25D2;font-weight:bold;`,
          result,
        )
      })
    } else {
      node.placeholder = placeholder
    }
  },
} as RegisterOptions
