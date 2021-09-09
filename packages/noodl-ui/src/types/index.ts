import { ActionType, ComponentType, EventType } from 'noodl-types'
import { event as eventId, lib, noodluiObserver } from '../constants'

export * from './actionTypes'
export * from './componentTypes'
export * from './storeTypes'
export * from './types'

export interface PlainObject {
  [key: string]: any
}

export type NOODLUIActionType = ActionType | typeof lib.actionTypes[number]
export type NOODLUIComponentType = ComponentType | typeof lib.components[number]
export type NOODLUITrigger = EventType | typeof lib.emitTriggers[number]
export type NOODLUIObserverEvent = typeof noodluiObserver[keyof typeof noodluiObserver]

export type ActionStatus = typeof eventId.action.status[keyof typeof eventId.action.status]
export type ActionChainStatus = typeof eventId.actionChain.status[keyof typeof eventId.actionChain.status]
export type ActionChainEventAlias = keyof typeof eventId.actionChain
export type ActionChainEventId = typeof eventId.actionChain[ActionChainEventAlias]
export type ActionEventAlias = keyof typeof eventId.action
export type ActionEventId = typeof eventId.action[ActionEventAlias]
export type ActionTriggerType = EmitTrigger
export type EmitTrigger = typeof lib.emitTriggers[number]
export type EventId = ActionEventId | ActionChainEventId
