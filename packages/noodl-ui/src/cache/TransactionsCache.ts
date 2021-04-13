import { Transaction, TransactionId } from '../types'

class TransactionCache {
  #cache = new Map<TransactionId, Transaction[TransactionId]>()

  static _inst: TransactionCache

  constructor() {
    if (TransactionCache._inst) return TransactionCache._inst
    TransactionCache._inst = this
  }

  clear() {
    this.#cache.clear()
    return this
  }

  get<K extends TransactionId>(transaction: K): Transaction[K]
  get(): Map<TransactionId, Transaction[TransactionId]>
  get<K extends TransactionId>(transaction?: K) {
    if (!transaction) return this.#cache
    return this.#cache.get(transaction)
  }

  has<K extends TransactionId>(transaction: K) {
    return this.#cache.has(transaction)
  }

  set<K extends TransactionId>(
    transaction: K,
    obj: Transaction[TransactionId],
  ) {
    this.#cache.set(transaction, obj)
    return this
  }
}

export default TransactionCache
