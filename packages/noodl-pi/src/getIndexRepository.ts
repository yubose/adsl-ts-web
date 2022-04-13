// @ts-nocheck
import getFuzzyIndexCreator from './getFuzzyIndexCreator'
import getDocDaoQueries from './getDocDaoQueries'
import getIndexDaoQueries from './getIndexDaoQueries'
import getPersonalIndexCtr from './getPersonalIndexCtr'
import type { ExecuteSQL } from './types'

function getIndexRepository(run: ExecuteSQL, tableName: string) {
  let indexDaoQueries = getIndexDaoQueries(run, tableName)
  let docDaoQueries = getDocDaoQueries(run, tableName)
  let personalIndexCtr = getPersonalIndexCtr(run, tableName)

  const o = {
    async search(input: string, sCondition: string) {
      if (!input) return
      const fuzzyCreator = getFuzzyIndexCreator()
      const initMapping = fuzzyCreator.initialMapping(input)
      const fuzzyInd = fuzzyCreator.toFuzzyHex(initMapping)
      const res = await indexDaoQueries.extendAndFuzzySearch({
        kInput: input,
        ins_hex: fuzzyInd,
      })
      console.log('fuzzysearch', input, res)

      let docs: any[] = []
      if (!res?.length) return docs

      const { values } = res[0]
      const flattenValues = values.reduce((acc, id) => {
        if (!acc.includes(id[0])) {
          acc.push(id[0])
        }
        return acc
      }, [])
      docs = this.getDocsByIds(flattenValues, sCondition)
      console.log('test', docs)
      const returnDocs: any[] = []
      for (let j = 0; j < docs.length; j++) {
        const doc = docs[j]
        if (doc?.length) {
          const obj: any = {}
          const { columns, values } = doc[0]
          for (let i = 0; i < columns.length; i++) {
            const prop = columns[i]
            const val = values[0][i]
            if (['deat', 'name'].includes(prop)) {
              obj[prop] = JSON.parse(val)
            } else {
              obj[prop] = val
            }
          }
          returnDocs.push(obj)
        } else {
          const s3Doc = await this.getS3DocById(flattenValues[j])
          returnDocs.push(s3Doc?.document[0])
        }
      }

      return returnDocs
    },
    async getS3DocById(docId: string) {
      const idList = [docId]
      const requestOptions: any = {
        xfname: 'id',
      }
      // console.log('test retrievePersonalIndex',idList)
      let rawResponse
      await store.level2SDK.documentServices
        .retrieveDocument({
          idList,
          options: requestOptions,
        })
        .then((res) => {
          rawResponse = res?.data
        })
      //insert into doc table
      const doc = rawResponse?.document[0]
      this.cacheDoc(doc)
      return rawResponse
    },
    async getDataBase(config) {
      if (config) {
        // await this.userDB.getDatabase(config)
        // this.docTableDao = this.userDB.DocTableDao
        // this.indexTablesDao = this.userDB.IndexTablesDao
        // personalIndexCtr = getPersonalIndexCtr(this.indexTablesDao)
      }
    },
    async indexTableIsEmpty() {
      return (await indexDaoQueries.getCount()) === 0
    },
    insertIndexData(personalIndexTables) {
      indexDaoQueries.insertAll(personalIndexTables)
    },
    getTypeById(did) {
      return indexDaoQueries.getTypeById(did)
    },
    deleteIndexByDocId(did) {
      indexDaoQueries.deleteIndexByDocId(did)
    },
    getPIByDocId(did) {
      return indexDaoQueries.getPIByDocId(did)
    },
    getkTextByDid(docId) {
      return indexDaoQueries.getAllkTextByDid(docId)
    },
    getAllDocId() {
      return indexDaoQueries.getAllDocId()
    },
    getAllDocByFkey({ kInput, ins_hex }) {
      return indexDaoQueries.extendAndFuzzySearch({ kInput, ins_hex })
    },
    getDocById(did) {
      return docDaoQueries.getDocById?.(did)
    },
    cacheDoc(doc) {
      docDaoQueries.insertDoc(doc)
    },
    deleteCachedDocById(did) {
      return docDaoQueries.deleteDocById(did)
    },
    getDocsByIds(relatedDocsIds, sCondition) {
      const result: any[] = []
      for (const did of relatedDocsIds) {
        result.push(docDaoQueries.getDocById?.(did, sCondition))
      }
      return result
    },
    getDocsByPageId(pageId) {
      return docDaoQueries.getDocsByPageId(pageId)
    },
    getLastestDocsByType(payload) {
      return docDaoQueries.getLastestDocsByType(payload?.type)
    },
    getAllDocsByType(payload) {
      return docDaoQueries.getAllDocsByType(payload?.type)
    },
  }

  return o
}

export default getIndexRepository
