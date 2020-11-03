import { NOODL } from 'noodl-ui'
import createElement from 'utils/createElement'

const noodlui = new NOODL<ReturnType<typeof createElement>>({
  createNode: function (noodlComponent, component) {
    return createElement(component.type as any)
  },
})

export default noodlui
