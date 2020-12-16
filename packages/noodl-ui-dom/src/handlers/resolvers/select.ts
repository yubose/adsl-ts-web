import { Component } from 'noodl-ui'
import { optionExists, toSelectOption } from '../../utils'

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

const resolveSelectElement = <N extends HTMLSelectElement = any>(
  node: N | null,
  component: Component,
) => {
  if (node && Array.isArray(component.get('options'))) {
    const dataValue = component.get('data-value')
    component.get('options')?.forEach((option: any, index) => {
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
  }
}

export default resolveSelectElement
