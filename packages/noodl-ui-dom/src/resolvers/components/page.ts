// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
import { ComponentInstance, event as noodluiEvent } from 'noodl-ui'
import { RegisterOptions } from '../../types'

// window.addEventListener('message')

export default {
  name: '[noodl-ui-dom] page',
  cond: 'page',
  resolve(node: HTMLIFrameElement, component, options) {
    const { draw, redraw, noodlui } = options
    node.name = component.get('path') || ''

    const log = (id: string, msg: string, data: any) => {
      console.log(
        `%c[noodl-ui-dom][${id}] ${msg}`,
        `color:#c4a901;font-weight:bold;`,
        { ...data, ...options },
      )
    }

    component.on(
      'path',
      (src: string) => {
        console.log(`%cRECEIVED SRC`, `color:#00b406;font-weight:bold;`, {
          component,
          node,
          src,
        })
      },
      '[noodl-ui-dom] path',
    )

    component.on(
      noodluiEvent.component.page.COMPONENTS_RECEIVED,
      (noodlComponents) => {
        log(
          noodluiEvent.component.page.COMPONENTS_RECEIVED,
          'Received components',
          { noodlComponents },
        )
      },
      `[noodl-ui-dom] ${noodluiEvent.component.page.COMPONENTS_RECEIVED}`,
    )

    component.on(
      noodluiEvent.component.page.RETRIEVE_COMPONENTS,
      (args) => {
        log(
          noodluiEvent.component.page.RETRIEVE_COMPONENTS,
          'Retrieve components',
          args,
        )
      },
      `[noodl-ui-dom] ${noodluiEvent.component.page.RETRIEVE_COMPONENTS}`,
    )

    component.on(
      noodluiEvent.component.page.RESOLVED_COMPONENTS,
      () => {
        log(
          noodluiEvent.component.page.RESOLVED_COMPONENTS,
          'Resolved components',
          { component, children: component.children() },
        )
        component.children().forEach((child: ComponentInstance) => {
          console.log(child)
          const childNode = draw(child, node.contentDocument?.body)
          redraw(childNode, child, options)
          window.child = childNode
        })
      },
      `[noodl-ui-dom] ${noodluiEvent.component.page.RESOLVED_COMPONENTS}`,
    )

    component.on(
      noodluiEvent.component.page.MISSING_COMPONENTS,
      (args) => {
        console.log(
          `%c[noodl-ui-dom][${noodluiEvent.component.page.MISSING_COMPONENTS}] Missing components`,
          `color:#ec0000;font-weight:bold;`,
          args,
        )
      },
      `[noodl-ui-dom] ${noodluiEvent.component.page.MISSING_COMPONENTS}`,
    )
  },
} as RegisterOptions
