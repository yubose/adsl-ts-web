import { Store, Transaction } from './types'
import { mapActionTypesToOwnArrays } from './utils/internal'
import Resolver from './Resolver'

const store = (function _store() {
  let actions = mapActionTypesToOwnArrays<Store.ActionObject>()
  let builtIns = {} as { [funcName: string]: Store.BuiltInObject[] }
  let plugins = { head: [], body: { top: [], bottom: [] } } as Store.Plugins
  let resolvers = [] as Resolver<any>[]
  let transactions = {} as Transaction

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
  }

  return o
})()

// @ts-expect-error
if (typeof window !== 'undefined') window.store = store

export default store
