import { getType, NOODL } from 'noodl-ui'
import createElement from 'utils/createElement'

const noodlui = new NOODL<ReturnType<typeof createElement>>({
  createNode: function (noodlComponent, component) {
    const node = createElement(getType(component))
    const parent = component.parent()
    console.log('parent', parent)
    if (parent) {
      const parentNode = document.getElementById(parent.id)
      console.log(`parentNode`, parentNode)
      if (!parentNode) {
        document.body.appendChild(node)
      } else {
        parentNode.appendChild(node)
      }
    }
    return node
  },
})

export default noodlui
