function createStore(db: IDBOpenDBRequest) {
  let _transaction = db.transaction
  let _store = _transaction?.objectStore(db.result.name) as IDBObjectStore

  return _store
}

export default createStore
