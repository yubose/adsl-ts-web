import type IDB from 'idb'
import type { DB } from '../types'

class ApiHashTableDao<
  S extends IDB.DBSchema,
  N extends IDB.StoreNames<S>,
  Skey extends IDB.StoreKey<S, N> = IDB.StoreKey<S, N>,
> {
  db: DB<S>
  storeName: N

  constructor(storeName: N, db: DB<S>) {
    this.db = db
    this.storeName = storeName
  }

  async getApiResult(
    apiInputHash: IDBKeyRange | Skey,
  ): Promise<IDB.StoreValue<S, N> | undefined> {
    return this.db.get(this.storeName, apiInputHash)
  }

  insertApiResult(apiInputHash: Skey, apiResult: any) {
    return this.db.put(this.storeName, apiResult, apiInputHash)
  }

  deleteApiResult(apiInputHash: IDBKeyRange | Skey) {
    return this.db.delete(this.storeName, apiInputHash)
  }
}

export default ApiHashTableDao
