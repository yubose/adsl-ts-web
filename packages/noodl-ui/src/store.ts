import { ActionType } from 'noodl-types'
import {
  ActionChainEventId,
  ActionObject,
  AnyFn,
  BuiltInObject,
  StoreActionObject,
  StoreBuiltInObject,
} from './types'
import { isArr, isObj } from './utils/internal'
import createComponentCache from './utils/componentCache'
import Resolver from './Resolver'

export type Store = ReturnType<typeof getStore>

const getStore = (function () {
  let actions = {} as Record<
    ActionType | 'anonymous' | 'emit' | 'goto',
    StoreActionObject<any>[]
  >
  let builtIns = {} as { [funcName: string]: StoreBuiltInObject<any>[] }
  let chaining = {} as { [K in ActionChainEventId]: AnyFn[] }
  let componentCache = createComponentCache()
  let resolvers = [] as Resolver[]

  function use<A extends ActionObject>(action: StoreActionObject<A>): void
  function use<B extends BuiltInObject>(action: StoreBuiltInObject<B>): void
  function use(resolver: Resolver): void
  function use(mod: any, ...rest: any[]) {
    const mods = ((isArr(mod) ? mod : [mod]) as any[]).concat(rest)
    const handleMod = (m: any) => {
      if (m) {
        const store = getStore()
        if (isObj(m)) {
          if (m.actionType === 'builtIn') {
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
        } else if (m instanceof Resolver) {
          store.resolvers.push(m)
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
    use,
  }

  return function store() {
    return o
  }
})()

export default getStore
