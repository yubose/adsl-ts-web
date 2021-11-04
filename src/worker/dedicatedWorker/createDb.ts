/// <reference lib="WebWorker" />

function createDb(name: string) {
  if (!name) throw new Error(`name is required`)

  const db = self.indexedDB.open(name)

  return db
}

export default createDb
