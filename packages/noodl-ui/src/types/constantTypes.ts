import {
  actionTypes,
  actionChainEmitTriggers,
  componentTypes,
  contentTypes,
  emitTriggers,
  event,
  eventTypes,
  resolveEmitTriggers,
} from '../constants'

export type ActionEventAlias = keyof typeof event.action
export type ActionEventId = typeof event.action[ActionEventAlias]
export type ActionChainEventAlias = keyof typeof event.actionChain
export type ActionChainEventId = typeof event.actionChain[ActionChainEventAlias]
export type EventId = ActionEventId | ActionChainEventId
export type IActionChainEmitTrigger = typeof actionChainEmitTriggers[number]
export type IListEventObject = typeof event.component.list
export type IListEventAlias = keyof IListEventObject
export type IListEventId = IListEventObject[IListEventAlias]
export type IListItemEventObject = typeof event.component.listItem
export type IListItemEventAlias = keyof IListItemEventObject
export type IListItemEventId = IListItemEventObject[IListItemEventAlias]
export type NOODLActionType = typeof actionTypes[number]
export type NOODLActionTriggerType = typeof eventTypes[number]
export type NOODLComponentType = typeof componentTypes[number] | 'br'
export type NOODLContentType = typeof contentTypes[number]
export type NOODLActionChainEmitTrigger = typeof actionChainEmitTriggers[number]
export type NOODLEmitTrigger = typeof emitTriggers[number]
export type NOODLResolveEmitTrigger = typeof resolveEmitTriggers[number]
export type ResolveEmitTrigger = typeof resolveEmitTriggers[number]
