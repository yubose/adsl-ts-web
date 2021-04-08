import { ICache, NUIActionType, NUITrigger, Store } from '../types'
import { actionTypes, triggers } from '../constants'

class ActionsCache implements ICache {
  #actions = new Map<
    Exclude<NUIActionType, 'builtIn' | 'emit'>,
    Store.ActionObject[]
  >()
  #builtIns = new Map<string, Store.BuiltInObject[]>()
  #emits = new Map<NUITrigger, Store.ActionObject[]>();

  [Symbol.iterator]() {
    const items = [
      ...this.#actions.values(),
      ...this.#builtIns.values(),
      ...this.#emits.values(),
    ].reverse()
    return {
      next: () => ({ value: items.pop(), done: !items.length }),
    }
  }

  constructor() {
    actionTypes.forEach(
      (actionType) =>
        !['builtIn', 'emit'].includes(actionType) &&
        this.#actions.set(
          actionType as Exclude<NUIActionType, 'builtIn' | 'emit'>,
          [],
        ),
    )
    triggers.forEach((trigger) => this.#emits.set(trigger, []))
  }

  get length() {
    return this.
  }

  clear() {
    //
  }
}

export default ActionsCache
