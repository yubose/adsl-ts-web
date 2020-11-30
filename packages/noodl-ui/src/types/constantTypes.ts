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

export type ActionChainEmitTrigger = typeof actionChainEmitTriggers[number]
export type ActionChainEventAlias = keyof typeof event.actionChain
export type ActionChainEventId = typeof event.actionChain[ActionChainEventAlias]
export type ActionEventAlias = keyof typeof event.action
export type ActionEventId = typeof event.action[ActionEventAlias]
export type ActionTriggerType = typeof eventTypes[number]
export type ActionType = typeof actionTypes[number]
export type ComponentType = typeof componentTypes[number] | 'br'
export type ContentType = typeof contentTypes[number]
export type EmitTrigger = typeof emitTriggers[number]
export type EventId = ActionEventId | ActionChainEventId
export type ListEventObject = typeof event.component.list
export type ListEventId = ListEventObject[keyof ListEventObject]
export type ResolveEmitTrigger = typeof resolveEmitTriggers[number]
