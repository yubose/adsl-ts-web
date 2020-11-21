import { IComponentTypeInstance } from 'noodl-ui'
import { ensureDatasetHandlingArr, isHandlingEvent } from '../utils'

const ID = 'nud.onChange'

const wrapper = (node, component, cb) => (evt: any) => {}

function onChange<N extends HTMLElement>(
  node: N,
  component: IComponentTypeInstance,
  cb,
) {
  if (node && component) {
    if (!isHandlingEvent(node, ID)) {
      ensureDatasetHandlingArr(node)
      const fn = component.get('onChange')
      if (typeof fn === 'function') {
        node.addEventListener('change', wrapper(node, component, cb))
        ;(node.dataset.handling as string)?.push(ID)
      }
    } else {
      console.log(
        'Aborted this function to avoid attaching a duplicate "onChange" ' +
          'handler',
        { node, component },
      )
    }
  }
}

export default onChange
