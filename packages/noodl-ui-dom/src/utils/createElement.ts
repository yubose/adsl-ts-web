import { NUIComponent } from 'noodl-ui'
import { getElementTag } from './utils'

function createElement(
  component: NUIComponent.Instance | NUIComponent.Type | undefined,
) {
  return document.createElement(
    (component && getElementTag(component)) || 'div',
  )
}

export default createElement
