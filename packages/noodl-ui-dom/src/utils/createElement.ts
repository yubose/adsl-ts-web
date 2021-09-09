import { NuiComponent } from 'noodl-ui'
import { getElementTag } from './utils'

function createElement(
  component: NuiComponent.Instance | NuiComponent.Type | undefined,
) {
  return document.createElement(
    (component && getElementTag(component)) || 'div',
  )
}

export default createElement
