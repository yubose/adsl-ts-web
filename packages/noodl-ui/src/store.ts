import { ActionType } from 'noodl-types'
import {
  ActionChainEventId,
  ActionObject,
  AnyFn,
  BuiltInObject,
  StoreActionObject,
  StoreBuiltInObject,
  StoreResolverObject,
} from './types'
import { isArr, isObj } from './utils/internal'
import createComponentCache from './utils/componentCache'

export type Store = ReturnType<typeof getStore>

const getStore = (function () {
  let actions = {} as Record<
    ActionType | 'anonymous' | 'emit' | 'goto',
    StoreActionObject<any>[]
  >
  let builtIns = {} as { [funcName: string]: StoreBuiltInObject<any>[] }
  let chaining = {} as { [K in ActionChainEventId]: AnyFn[] }
  let componentCache = createComponentCache()
  let resolvers = [] as StoreResolverObject[]

  function use<A extends ActionObject>(action: StoreActionObject<A>): void
  function use<B extends BuiltInObject>(action: StoreBuiltInObject<B>): void
  function use(obj: StoreResolverObject): void
  function use(
    mod: StoreActionObject<any> | StoreBuiltInObject<any> | StoreResolverObject,
    ...rest: any[]
  ) {
    const mods = ((isArr(mod) ? mod : [mod]) as any[]).concat(rest)
    const handleMod = (m: any) => {
      if (m) {
        const store = getStore()
        if (isObj<any>(m)) {
          if ('resolver' in m) {
            if (m.name && resolvers.every((obj) => obj.name !== m.name)) {
              resolvers.push(m)
            }
          } else if (m.actionType === 'builtIn' || 'funcName' in m) {
            if (!('actionType' in m)) m.actionType = 'builtIn'
            if (!isArr(store.builtIns[m.funcName])) {
              store.builtIns[m.funcName] = []
            }
            store.builtIns[m.funcName] = store.builtIns[m.funcName].concat(
              isArr(m) ? m : [m],
            )
          } else if ('actionType' in m) {
            if (!isArr(store.actions[m.actionType])) {
              store.actions[m.actionType] = []
            }
            store.actions[m.actionType]?.push(m)
          }
        }
      }
    }
    mods.forEach((m) =>
      isArr(m) ? m.concat(rest).forEach(handleMod) : handleMod(m),
    )
  }

  const o = {
    get actions() {
      return actions
    },
    get builtIns() {
      return builtIns
    },
    get chaining() {
      return chaining
    },
    get componentCache() {
      return componentCache
    },
    get resolvers() {
      return resolvers
    },
    clearActions() {
      Object.values(actions).forEach((arr) => (arr.length = 0))
    },
    clearBuiltIns() {
      Object.values(builtIns).forEach((arr) => (arr.length = 0))
    },
    use,
  }

  return function store() {
    return o
  }
})()

export default getStore
