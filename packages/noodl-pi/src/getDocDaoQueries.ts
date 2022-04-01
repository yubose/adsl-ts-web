import { isObj, uint8ArrayToBase64 } from './utils'
import type { ExecuteSQL } from './types'

function getDocDaoQueries(run: ExecuteSQL, tableName: string) {
  return {
    convertSqlToObject(docs: any) {
      let returnDocs: any[] = []
      if (docs.length) {
        const { columns, values } = docs[0]
        for (const value of values) {
          const obj = {}
          for (let i = 0; i < value.length; i++) {
            obj[columns[i]] = value[i]
          }
          returnDocs.push(obj)
        }
        return returnDocs
      }
    },
    deleteDocById(did: string) {
      return run(`DELETE FROM ecos_doc_table WHERE id = ${did}`)
    },
    getDocById(did: string, sCondition?: string) {
      return run(
        `SELECT * FROM ${tableName} WHERE id = ${did} ${
          sCondition ? 'AND ' + sCondition : ''
        } LIMIT 1`,
      )
    },
    getByIds(dids: string[]) {
      if (!dids) dids = []
      let str = `SELECT * FROM ${tableName} WHERE id IN(`
      const params = {}
      dids.forEach((did, index) => {
        const key = `${did}${index}`
        str += key + (index === dids.length - 1 ? ')' : ',')
        params[key] = did
      })
      return run(str)
    },
    getDocsByPageId(pageId: string) {
      return run(`SELECT * FROM ${tableName} WHERE pageId = ${pageId}`)
    },
    getLastestDocsByType(type: string | number) {
      return run(`SELECT id FROM ${tableName} WHERE type = ${type} LIMIT 1`)
    },
    getAllDocsByType(type: string | number) {
      return run(`SELECT * FROM ${tableName} WHERE type = ${type}`)
    },
    insertDoc(doc: any = {}) {
      let str = `INSERT INTO ${tableName} VALUES (:ctime, :mtime, :atime, :atimes, :id, :name, :deat, :size, :fid, :eid, :bsig, :esig, :subtype, :type, :tage);`
      for (const [key, val] of Object.entries(doc)) {
        if (val instanceof Uint8Array) {
          str += `${uint8ArrayToBase64(val)},`
        } else if (isObj(val)) {
          str += `${JSON.stringify(val)},`
        } else {
          str += `${val},`
        }
      }
      if (str.endsWith(',')) str = str.substring(0, str.length)
      str += `);`
      return run(str)
    },
  }
}

export default getDocDaoQueries
