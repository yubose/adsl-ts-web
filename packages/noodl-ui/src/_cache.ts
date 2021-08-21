import { LiteralUnion } from 'type-fest'
import ActionsCache from './cache/ActionsCache'
import ComponentCache from './cache/ComponentCache'
import PageCache from './cache/PageCache'
import PluginCache from './cache/PluginCache'
import RegisterCache from './cache/RegisterCache'
import TransactionCache from './cache/TransactionsCache'
import * as t from './types'

export default {
  actions: new ActionsCache() as ActionsCache &
    Record<
      t.NUIActionGroupedType,
      t.Store.ActionObject<t.NUIActionGroupedType>[]
    > & {
      builtIn: Map<string, t.Store.BuiltInObject[]>
      emit: Map<LiteralUnion<t.NUITrigger, string>, t.Store.ActionObject[]>
      register: Record<string, t.Register.Object[]>
    },
  component: new ComponentCache(),
  page: new PageCache(),
  plugin: new PluginCache(),
  register: new RegisterCache(),
  transactions: new TransactionCache(),
}
