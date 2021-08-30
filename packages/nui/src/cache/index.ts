import { LiteralUnion } from 'type-fest'
import ActionsCache from './ActionsCache'
// import ComponentCache from './cache/ComponentCache'
// import PageCache from './cache/PageCache'
// import PluginCache from './cache/PluginCache'
// import RegisterCache from './cache/RegisterCache'
// import TransactionCache from './cache/TransactionsCache'
import * as t from '../types'

// const _componentCache = new ComponentCache()
// const _pageCache = new PageCache()
// const _pluginCache = new PluginCache()
// const _registerCache = new RegisterCache()
// const _transactionCache = new TransactionCache()

const cache = {
  actions: new ActionsCache() as ActionsCache &
    Record<
      t.NuiActionGroupedType,
      t.Store.ActionObject<t.NuiActionGroupedType>[]
    > & {
      builtIn: Map<string, t.Store.BuiltInObject[]>
      emit: Map<LiteralUnion<t.NuiTrigger, string>, t.Store.ActionObject[]>
      register: Record<string, t.Register.Object[]>
    },
  // component: _componentCache,
  // page: _pageCache,
  // plugin: _pluginCache,
  // register: _registerCache,
  // transactions: _transactionCache,
}

export default cache
