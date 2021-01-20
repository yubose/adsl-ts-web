import { RegisterOptions } from '../../types'

export default {
  name: '[noodl-ui-dom] button',
  cond: 'button',
  resolve(node: HTMLButtonElement, component) {
    const { onClick: onClickProp, src = '' } = component.get(['onClick', 'src'])
    /**
     * Buttons that have a "src" property
     * ? NOTE: Seems like these components are deprecated. Leave this here for now
     */
    if (src) {
      node.style['overflow'] = 'hidden'
      node.style['display'] = 'flex'
      node.style['alignItems'] = 'center'
    }
    node.style['cursor'] =
      typeof onClickProp === 'function' ? 'pointer' : 'auto'
  },
} as RegisterOptions
