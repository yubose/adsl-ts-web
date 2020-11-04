import { getType, NOODL } from 'noodl-ui'
import createElement from 'utils/createElement'

const noodlui = new NOODL<ReturnType<typeof createElement>>({
  createNode: function (noodlComponent, { component }) {
    const node = createElement(getType(component))
    return node
  },
})

export default noodlui
