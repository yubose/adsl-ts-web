import { optionExists, toSelectOption } from '../../utils'
import { RegisterOptions } from '../../types'

export default {
  name: '[noodl-ui-dom] select',
  cond: 'select',
  resolve(node: HTMLSelectElement, component) {
    // node.value = component.get('data-value')
    component.get('options')?.forEach((option: any) => {
      option = toSelectOption(option)
      if (!optionExists(node, option)) {
        const optionNode = document.createElement('option')
        node.appendChild(optionNode)
        optionNode.id = option.key
        optionNode.value = option.value
        optionNode.textContent = option.label

        if (option?.value === component.get('data-value')) {
          // Default to the selected index if the user already has a state set before
          node.selectedIndex = option.index
          node.dataset.value = option.value
          node.value = option.value
        }
      }
    })
    // Default to the first item if the user did not previously set their state
    if (node?.selectedIndex === -1) node.selectedIndex = 0
  },
} as RegisterOptions
