import { ActionType, ComponentType, EventType, userEvent } from 'noodl-types'
import { event, lib } from '../constants'

export type NOODLUIActionType = ActionType | typeof lib.actionTypes[number]
export type NOODLUIComponentType = ComponentType | typeof lib.components[number]
export type NOODLUITrigger = EventType | typeof lib.emitTriggers[number]
// export type NOODLUIObserverEvent = typeof noodluiObserver[keyof typeof noodluiObserver]

export type ActionChainEmitTrigger = typeof userEvent[number]
export type ActionChainEventAlias = keyof typeof event.actionChain
export type ActionChainEventId = typeof event.actionChain[ActionChainEventAlias]
export type ActionEventAlias = keyof typeof event.action
export type ActionEventId = typeof event.action[ActionEventAlias]
export type EventId = ActionEventId | ActionChainEventId | PageComponentEventId
export type PageEventId = typeof event.SET_PAGE | typeof event.NEW_PAGE
export type PageComponentEventId = PageComponentEventObject[keyof PageComponentEventObject]
export type PageComponentEventObject = typeof event.component.page
