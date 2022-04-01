import orderBy from 'lodash.orderby'
import { uint8ArrayToBase64 } from './utils'
import { jarowinkler } from './wuzzy'
import type { ExecuteSQL } from './types'

function getIndexDaoQueries(run: ExecuteSQL, tableName: string) {
  return {
    deleteIndexByDocId(did: string) {
      return run(`DELETE FROM index_tables WHERE docId = ${did}`)
    },
    async extendAndFuzzySearch({
      kInput,
      ins_hex,
      docType,
      docTypeLow,
      docTypeHigh,
    }: {
      kInput: string
      ins_hex: string
      docType?: number
      docTypeLow?: number
      docTypeHigh?: number
    }) {
      let str =
        `SELECT * FROM ${tableName} WHERE` +
        " printf('%X', fKey) LIKE '%'|| :ins_hex ||'%'" +
        " OR kText LIKE :kInput || '%'"

      let params = { ':ins_hex': ins_hex, ':kInput': kInput }

      if (docType) {
        str =
          `SELECT * FROM ${tableName} WHERE` +
          ` docType = ${docType}` +
          ' AND (' +
          `printf('%X', fKey) LIKE '%'|| ${ins_hex} ||'%'` +
          ' OR ' +
          `kText LIKE ${kInput} || '%'  )`
      } else if (docTypeLow && docTypeHigh) {
        str =
          `SELECT * FROM ${tableName} WHERE` +
          ` docType BETWEEN ${docTypeLow} AND ${docTypeHigh}` +
          ` AND (` +
          `printf('%X', fKey) LIKE '%'|| ${ins_hex} ||'%'` +
          ` OR ` +
          `kText LIKE ${kInput} || '%'  )`
      }

      const res = await run(str)

      if (res?.length) {
        const { columns, values } = res[0]
        // ngram
        for (const value of values) value[4] = jarowinkler(kInput, value[1], 1)
        // sort
        const sortValues = orderBy(values, (arr) => arr[4], 'desc')
        console.log('ngram sort', { sortValues })
        let newValues: any[] = []
        for (const sortValue of sortValues) newValues.push([sortValue[2]])
        let newColumns = [columns[2]]
        res[0] = { columns: newColumns, values: newValues }
      }

      return res
    },
    getAllDoc() {
      return run(`SELECT * FROM index_tables`)
    },
    /* for update to S3 */
    getAllDocId() {
      return run(`SELECT DISTINCT docId FROM index_tables`)
    },
    getAllkTextByDid(did: string) {
      return run(
        `SELECT kText FROM index_tables WHERE docId = ${did} ORDER BY score`,
      )
    },
    getAllScoreByDid(did: string) {
      return run(
        `SELECT score FROM index_tables WHERE docId = ${did} ORDER By score`,
      )
    },
    getTypeById(did: string) {
      return run(
        `SELECT DISTINCT docType FROM index_tables WHERE docId = ${did}`,
      )
    },
    getmTimeById(did: string) {
      return run(`SELECT DISTINCT mTime FROM index_tables WHERE docId = ${did}`)
    },
    async getLatestDocId() {
      const res = await run(`SELECT docId FROM index_tables LIMIT 1`)
      if (res.length) {
        const { columns, values } = res[0]
        return values[0][0]
      }
    },
    async getPI_mtime() {
      const res = await run(
        `SELECT mTime FROM index_tables ORDER BY mtime desc LIMIT 1`,
      )
      if (res.length) {
        const { columns, values } = res[0]
        return values[0][0]
      }
      return 0
    },
    getCount() {
      return run(`SELECT COUNT(*) FROM ${tableName}`)
    },
    getPIByDocId(did: string) {
      return run(`SELECT * FROM index_tables WHERE docId = ${did}`)
    },
    async indexTableIsEmpty() {
      const res = await run(`SELECT COUNT(*) FROM index_tables`)
      const count = res[0].values[0][0]
      if (count) return false
      return true
    },
    insertAll(indexTableEntry: Record<string, any>) {
      let str = `INSERT INTO ${tableName} VALUES (:fKey , :kText , :docId , :docType , :score);`

      for (let val of Object.values(indexTableEntry)) {
        if (val instanceof Uint8Array) str += uint8ArrayToBase64(val)
        else str += val
      }

      return run(str)
    },
  }
}

export default getIndexDaoQueries
