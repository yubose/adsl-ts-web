import type IDB from 'idb'
import type { DB } from '../types'
import { isObj, uint8ArrayToBase64 } from '../utils'

class DocTableDao<
  S extends IDB.DBSchema,
  N extends IDB.StoreNames<S>,
  Skey extends IDB.StoreKey<S, N> = IDB.StoreKey<S, N>,
> {
  #db: DB<S>
  storeName: N // ecos_doc_table

  constructor(db: DB<S>, storeName: N) {
    this.#db = db
    this.storeName = storeName
  }

  async getDocById(did: Skey, sCondition?: string | undefined) {
    const result = await this.#db.get(this.storeName, did)
    const sqlstr = `SELECT * FROM ecos_doc_table WHERE id = :did ${
      sCondition ? 'AND ' + sCondition : ''
    } LIMIT 1`
    const params = { ':did': did }
    const res = this.#db.exec(sqlstr, params)
    return res
  }

  getDocByIds(dids: string[]) {
    if (!dids) dids = []
    let sqlstr = 'SELECT * FROM ecos_doc_table WHERE id IN('
    const params = {}
    dids.forEach((did, index) => {
      const key = `:did${index}`
      sqlstr += key + (index === dids.length - 1 ? ')' : ',')
      params[key] = did
    })
    const res = this.#db.exec(sqlstr, params)
    return res
  }

  insertDoc(doc: any) {
    const sqlstr =
      'INSERT INTO ecos_doc_table VALUES (:ctime, :mtime, :atime, :atimes, :id, :name, :deat, :size, :fid, :eid, :bsig, :esig, :subtype, :type, :tage);'
    const params = {}
    console.log('insertdoc!!', doc)
    for (const [key, val] of Object.entries(doc)) {
      if (val instanceof Uint8Array) {
        params[`:${key}`] = uint8ArrayToBase64(val)
      } else if (isObj(val)) {
        params[`:${key}`] = JSON.stringify(val)
      } else {
        params[`:${key}`] = val
      }
    }
    const res = this.#db.exec(sqlstr, params)
    return res
  }

  deleteDocById(did: string) {
    const sqlstr = `DELETE FROM ecos_doc_table WHERE id = :did`
    const params = {
      [':did']: did,
    }
    const res = this.#db.exec(sqlstr, params)
    return res
  }

  getDocsByPageId(pageId: string) {
    const sqlstr = `SELECT * FROM ecos_doc_table WHERE pageId = ${pageId}`
    const res = this.#db.exec(sqlstr)
    return res
  }

  getLastestDocsByType(type) {
    const sqlstr = `SELECT id FROM ecos_doc_table WHERE type = ${type} LIMIT 1 `
    const res = this.#db.exec(sqlstr)
    return res
  }

  getAllDocsByType(type: string) {
    const sqlstr = `SELECT * FROM ecos_doc_table WHERE type = ${type}`
    let res = this.#db.exec(sqlstr)
    res = this.convertSqlToObject(res)
    return res
  }

  convertSqlToObject(doc: any) {
    const returnDocs = []
    if (doc.length) {
      const { columns, values } = doc[0]
      for (const value of values) {
        const obj = {}
        for (let i = 0; i < value.length; i++) {
          obj[columns[i]] = value[i]
        }
        returnDocs.push(obj)
      }
      return returnDocs
    }
    return
  }
}

export default DocTableDao
