import { inspect } from 'util'
import { ICache, NUIActionType, NUITrigger, Store } from '../types'
import { actionTypes, triggers } from '../constants'

type OtherActionTypes = Exclude<NUIActionType, 'builtIn' | 'emit'>

const otherActions = actionTypes.filter(
  (t) => !/(builtIn|emit)/i.test(t),
) as OtherActionTypes[]

const getInitialActionsState = <AType extends string, StoreObj = any>(
  actionTypes: AType[],
) => {
  const actions = new Map<AType, StoreObj[]>()
  actionTypes.forEach((t) => actions.set(t, []))
  return actions
}

class ActionsCache implements ICache {
  #actions = getInitialActionsState<OtherActionTypes, Store.ActionObject>([
    ...otherActions,
  ])
  #builtIns = getInitialActionsState<'builtIn', Store.BuiltInObject>([])
  #emits = getInitialActionsState<NUITrigger, Store.ActionObject[]>([
    ...triggers,
  ]);

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

  [inspect.custom]() {
    return {
      ...this,
      length: this.length,
    }
  }

  constructor() {
    for (const actionType of this.#actions.keys()) {
      Object.defineProperty(this, actionType, {
        configurable: true,
        enumerable: true,
        get: () => this.#actions.get(actionType),
      })
    }
    Object.defineProperty(this, 'builtIn', {
      configurable: true,
      enumerable: true,
      get: () => this.#builtIns,
    })
    Object.defineProperty(this, 'emit', {
      configurable: true,
      enumerable: true,
      get: () => this.#emits,
    })
  }

  get length() {
    return this.#actions.size + this.#builtIns.size + this.#emits.size
  }

  clear() {
    this.#actions.clear()
    this.#builtIns.clear()
    this.#emits.clear()
  }

  reset() {
    this.#actions = getInitialActionsState([...otherActions])
    this.#emits = getInitialActionsState([...triggers])
  }
}

export default ActionsCache
