import _ from 'lodash'
import { queryHelpers } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { NOODLActionTriggerType } from 'noodl-ui'

export const queryByDataKey = queryHelpers.queryByAttribute.bind(
  null,
  'data-key',
)

export const queryByDataUx = queryHelpers.queryByAttribute.bind(null, 'data-ux')

export function mapUserEvent(noodlEventType: NOODLActionTriggerType) {
  switch (noodlEventType) {
    case 'onClick':
      return userEvent.click
    case 'onHover':
    case 'onMouseEnter':
      return userEvent.hover
    case 'onMouseLeave':
    case 'onMouseOut':
      return userEvent.unhover
    default:
      break
  }
}
