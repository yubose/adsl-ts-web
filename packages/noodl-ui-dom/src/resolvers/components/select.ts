import { toSelectOption } from '../../utils'
import { RegisterOptions } from '../../types'
import { SelectOption } from 'noodl-ui'

function clearOptions(node: HTMLSelectElement) {
  const numOptions = node.options
  for (let index = 0; index < numOptions.length; index++) {
    const option = node.options[index]
    option.remove()
  }
}

export default {
  name: '[noodl-ui-dom] select',
  cond: 'select',
  resolve(node: HTMLSelectElement, component) {
    let options = component.get('options') || []
    if (Array.isArray(options)) {
      clearOptions(node)
      options.forEach((option: SelectOption, index) => {
        option = toSelectOption(option)
        const optionNode = document.createElement('option')
        node.appendChild(optionNode)
        optionNode.id = option.key
        optionNode.value = option.value
        optionNode.textContent = option.label
        if (option?.value === component.get('data-value')) {
          // Default to the selected index if the user already has a state set before
          node.selectedIndex = index
          node.dataset.value = option.value
          node.value = option.value
        }
      })
    }
    // Default to the first item if the user did not previously set their state
    if (node?.selectedIndex === -1) node.selectedIndex = 0
  },
} as RegisterOptions
