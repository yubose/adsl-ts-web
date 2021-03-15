// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
import { ComponentInstance, event as noodluiEvent } from 'noodl-ui'
import { RegisterOptions } from '../../types'

export default {
  name: '[noodl-ui-dom] page',
  cond: 'page',
  resolve(node: HTMLIFrameElement, component, options) {
    const { draw, redraw, noodlui } = options
    node.name = component.get('path') || ''

    component.on(
      noodluiEvent.component.page.COMPONENTS_RECEIVED,
      () => {},
      `[noodl-ui-dom] ${noodluiEvent.component.page.COMPONENTS_RECEIVED}`,
    )

    component.on(
      noodluiEvent.component.page.RESOLVED_COMPONENTS,
      () => {
        component.children().forEach((child: ComponentInstance) => {
          const childNode = draw(child, node.contentDocument?.body)
          // redraw(childNode, child, options)
          ;(window as any).child = childNode
        })
      },
      `[noodl-ui-dom] ${noodluiEvent.component.page.RESOLVED_COMPONENTS}`,
    )

    component.on(
      noodluiEvent.component.page.MISSING_COMPONENTS,
      () => {},
      `[noodl-ui-dom] ${noodluiEvent.component.page.MISSING_COMPONENTS}`,
    )
  },
} as RegisterOptions
