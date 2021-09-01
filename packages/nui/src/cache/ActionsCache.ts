import * as u from '@jsmanifest/utils'
import type { LiteralUnion } from 'type-fest'
import type { NuiActionType, NuiTrigger, Store } from '../types'
import { groupedActionTypes, triggers } from '../constants'

type OtherActionTypes = Exclude<
  LiteralUnion<NuiActionType, string>,
  'builtIn' | 'emit' | 'register'
>

const getInitialActionsState = <AType extends string, StoreObj = any>(
  actionTypes: AType[],
) => {
  const actions = new Map<LiteralUnion<AType, string>, StoreObj[]>()
  actionTypes.forEach((t) => actions.set(t, []))
  return actions
}

type ActionsStore<AType extends string, StoreObj = any> = Map<
  LiteralUnion<AType, string>,
  StoreObj[]
>

class ActionsCache<ETrigger extends string = string> {
  #actions: ActionsStore<OtherActionTypes, Store.ActionObject>
  #builtIns: ActionsStore<'builtIn', Store.BuiltInObject>
  #emits: ActionsStore<
    LiteralUnion<NuiTrigger | ETrigger, string>,
    Store.ActionObject[]
  >;

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

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      ...this,
      length: this.length,
    }
  }

  constructor() {
    this.#actions = getInitialActionsState([...groupedActionTypes])
    this.#builtIns = getInitialActionsState([])
    this.#emits = getInitialActionsState([...triggers])

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

  exists(fn: Store.ActionObject['fn'] | Store.BuiltInObject['fn']) {
    if (u.isFnc(fn)) {
      for (const objs of this) {
        if (objs) {
          for (const obj of objs) {
            if ('actionType' in obj) {
              if (obj.fn === fn) return true
            } else {
              if (obj.some((o) => o.fn === fn)) return true
            }
          }
        }
      }
    }
    return false
  }

  reset() {
    this.#actions = getInitialActionsState([...groupedActionTypes])
    this.#builtIns = getInitialActionsState([])
    this.#emits = getInitialActionsState([...triggers])
  }
}

export default ActionsCache
