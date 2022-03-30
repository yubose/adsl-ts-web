import orderBy from 'lodash.orderby'
import type { DB } from '../types'
import { isObj, uint8ArrayToBase64 } from '../utils'

class IndexTableDao<
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

  getCount() {
    const sqlstr = 'SELECT COUNT(*) FROM index_tables'
    const res = this.db.exec(sqlstr)
    console.log(res)
    return res[0].values[0][0]
  }

  insertAll(indexTableEntry: Record<string, any>) {
    const sqlstr =
      'INSERT INTO index_tables VALUES (:fKey , :kText , :docId , :docType , :score);'
    const params = {}
    for (const [key, val] of Object.entries(indexTableEntry)) {
      if (val instanceof Uint8Array) {
        params[`:${key}`] = uint8ArrayToBase64(val)
      } else {
        params[`:${key}`] = val
      }
    }
    const res = this.db.exec(sqlstr, params)
    return res
  }

  extendAndFuzzySearch({
    kInput,
    ins_hex,
    docType,
    docTypeLow,
    docTypeHigh,
  }: {
    kInput: string
    ins_hex: string
    docType: number
    docTypeLow: number
    docTypeHigh: number
  }) {
    let sqlstr =
      "SELECT * FROM index_tables WHERE printf('%X', fKey) LIKE '%'|| :ins_hex ||'%' OR kText LIKE :kInput || '%'"
    let params = { ':ins_hex': ins_hex, ':kInput': kInput }
    if (docType) {
      sqlstr =
        "SELECT * FROM index_tables WHERE docType = :docType AND (printf('%X', fKey) LIKE '%'|| :ins_hex ||'%' OR kText LIKE :kInput || '%'  )"
      params = {
        ':docType': docType,
        ':ins_hex': ins_hex,
        ':kInput': kInput,
      }
    } else if (docTypeLow && docTypeHigh) {
      sqlstr =
        "SELECT * FROM index_tables WHERE docType BETWEEN :docTypeLow AND :docTypeHigh AND (printf('%X', fKey) LIKE '%'|| :ins_hex ||'%' OR kText LIKE :kInput || '%'  )"
      params = {
        ':docTypeLow': docTypeLow,
        ':docTypeHigh': docTypeHigh,
        ':ins_hex': ins_hex,
        ':kInput': kInput,
      }
    }
    const res = this.db.exec(sqlstr, params)
    if (res && isArr(res) && (res == null ? void 0 : res.length)) {
      const { columns, values } = res[0]
      for (const value of values) {
        value[4] = jarowinkler(kInput, value[1], 1)
      }
      const sortValues = orderBy(
        values,
        function (arr) {
          return arr[4]
        },
        'desc',
      )
      console.log('ngram sort', { sortValues })
      const newValues = []
      for (const sortValue of sortValues) {
        newValues.push([sortValue[2]])
      }
      const newColumns = [columns[2]]
      res[0] = { columns: newColumns, values: newValues }
    }
    return res
  }
  getPIByDocId(did: Skey) {
    const sqlstr = 'SELECT * FROM index_tables WHERE docId = :did'
    const params = {
      ':did': did,
    }
    const res = this.db.exec(sqlstr, params)
    return res
  }
  deleteIndexByDocId(did: Skey) {
    const sqlstr = 'DELETE FROM index_tables WHERE docId = :did'
    const params = {
      ':did': did,
    }
    const res = this.db.exec(sqlstr, params)
    return res
  }
  getAllDocId() {
    const sqlstr = 'SELECT DISTINCT docId FROM index_tables'
    const res = this.db.exec(sqlstr)
    return res
  }
  getAllkTextByDid(did: Skey) {
    const sqlstr =
      'SELECT kText FROM index_tables WHERE docId = :did ORDER BY score'
    const params = {
      ':did': did,
    }
    const res = this.db.exec(sqlstr, params)
    return res
  }
  getAllScoreByDid(did: Skey) {
    const sqlstr =
      'SELECT score FROM index_tables WHERE docId = :did ORDER By score'
    const params = {
      ':did': did,
    }
    const res = this.db.exec(sqlstr, params)
    return res
  }
  getTypeById(did: Skey) {
    const sqlstr =
      'SELECT DISTINCT docType FROM index_tables WHERE docId = :did'
    const params = {
      ':did': did,
    }
    const res = this.db.exec(sqlstr, params)
    return res
  }
  getmTimeById(did: Skey) {
    const sqlstr = 'SELECT DISTINCT mTime FROM index_tables WHERE docId = :did'
    const params = {
      ':did': did,
    }
    const res = this.db.exec(sqlstr, params)
    return res
  }
  getPI_mtime() {
    const sqlstr = 'SELECT mTime FROM index_tables ORDER BY mtime desc LIMIT 1'
    const res = this.db.exec(sqlstr)
    if (res.length) {
      const { columns, values } = res[0]
      return values[0][0]
    }
    return 0
  }
  getLatestDocId() {
    const sqlstr = 'SELECT docId FROM index_tables LIMIT 1'
    const res = this.db.exec(sqlstr)
    if (res.length) {
      const { columns, values } = res[0]
      return values[0][0]
    }
    return
  }
  getAllDoc() {
    const sqlstr = 'SELECT * FROM index_tables'
    const res = this.db.exec(sqlstr)
    return res
  }
  indexTableIsEmpty() {
    const sqlstr = 'SELECT COUNT(*) FROM index_tables'
    const res = this.db.exec(sqlstr)
    const count = res[0].values[0][0]
    if (count) {
      return false
    }
    return true
  }
}

export default IndexTableDao
