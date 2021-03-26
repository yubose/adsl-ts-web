import { ActionObject } from 'noodl-types'
import { Store } from './types'
import {
  array,
  isArr,
  isObj,
  mapActionTypesToOwnArrays,
} from './utils/internal'
import Resolver from './Resolver'

const store = (function _store() {
  let actions = mapActionTypesToOwnArrays<Store.ActionObject>()
  let builtIns = {} as { [funcName: string]: Store.BuiltInObject[] }
  let plugins = { head: [], body: { top: [], bottom: [] } } as Store.Plugins
  let resolvers = [] as Resolver<any>[]
  let transactions = {} as {
    [transaction: string]: Store.TransactionObject['callback']
  }

  function use(action: Store.ActionObject): void
  function use(action: Store.BuiltInObject): void
  function use(plugin: Store.PluginObject): void
  function use(transaction: Store.TransactionObject): void
  function use(resolver: Resolver<any>): void
  function use(
    mod:
      | Store.ActionObject
      | Store.BuiltInObject
      | Store.PluginObject
      | Store.TransactionObject
      | Resolver<any>,
    ...rest: any[]
  ) {
    const mods = ((isArr(mod) ? mod : [mod]) as any[]).concat(rest)
    const handleMod = (m: any) => {
      if (m) {
        if (m instanceof Resolver) {
          if (
            m.name &&
            resolvers.every((resolver) => resolver.name !== m.name)
          ) {
            resolvers.push(m)
          }
        } else if ('transaction' in m) {
          array(m).forEach((mod: Store.TransactionObject) => {
            transactions[mod.transaction] = mod.callback
          })
        } else if (isObj(m)) {
          if (m.actionType === 'builtIn' || 'funcName' in m) {
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
          } else if ('location' in m) {
            store.plugins[m.location].push(m)
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
    get plugins() {
      return plugins
    },
    get resolvers() {
      return resolvers
    },
    get transactions() {
      return transactions
    },
    clearActions() {
      Object.values(actions).forEach((arr) => (arr.length = 0))
    },
    clearBuiltIns() {
      Object.values(builtIns).forEach((arr) => (arr.length = 0))
    },
    use,
  }

  return o
})()

// @ts-expect-error
if (typeof window !== 'undefined') window.store = store

export default store
