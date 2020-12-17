import { optionExists, toSelectOption } from '../utils'
import { RegisterOptions } from '../types'

export const setOption = (
  node: HTMLSelectElement,
  option: any,
): HTMLOptionElement => {
  option = toSelectOption(option)
  if (!optionExists(node, option)) {
    const optionNode = document.createElement('option')
    optionNode.id = option.key
    optionNode.value = option.value
    optionNode.innerText = option.label
    node?.appendChild(optionNode)
    return optionNode
  }
  return [...node.options].find(
    (opt) => opt.value === option.value,
  ) as HTMLOptionElement
}

export default {
  name: '[noodl-ui-dom] select',
  cond: (node) => node?.tagName === 'SELECT',
  resolve(node, component) {
    const dataValue = component.get('data-value')
    component.get('options')?.forEach((option: any, index: number) => {
      if (option) {
        option = toSelectOption(option)
        setOption(node, option)
        if (option?.value === dataValue) {
          // Default to the selected index if the user already has a state set before
          node.selectedIndex = index
        }
      }
    })
    if (node?.selectedIndex == -1) node.selectedIndex = 0
  },
} as RegisterOptions
