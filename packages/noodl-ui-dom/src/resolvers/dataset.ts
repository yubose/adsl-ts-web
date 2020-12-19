import { NOODLDOMElement, RegisterOptions } from '../types'
import { getDataAttribKeys } from '../utils'

export default {
  name: '[noodl-ui-dom] dataset',
  cond: (node, component) => !!(node && component),
  resolve: (node: NOODLDOMElement, component) => {
    Object.entries(
      component.get(getDataAttribKeys() as any) as { [key: string]: any },
    ).forEach(
      ([k, v]) =>
        v != undefined && node && (node.dataset[k.replace('data-', '')] = v),
    )
  },
} as RegisterOptions
