import { getType, NOODL } from 'noodl-ui'
import createElement from 'utils/createElement'

const noodlui = new NOODL<ReturnType<typeof createElement>>({
  createNode: function (noodlComponent, component) {
    return createElement(getType(component))
  },
})

export default noodlui
