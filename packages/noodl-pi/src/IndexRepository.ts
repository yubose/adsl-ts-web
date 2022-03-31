import type IDB from 'idb'
import FuzzyIndexCreator from './IndexCreator'
import PersonalIndexCtr from './PersonalIndexCtr'
import DocDao from './table/DocDao'
import IndexDao from './table/IndexDao'
import type { DB } from './types'

class IndexRepository<D extends IDB.DBSchema> {
  db: DB<D>
  docTableDao: DocDao<D> | null = null
  indexTablesDao: IndexDao<D> | null = null
  PersonalIndexCtr: PersonalIndexCtr | null = null

  constructor(db: DB<D>) {
    this.db = db
    this.indexTablesDao = new IndexDao(this.db)
  }

  async search(input: string, sCondition: string) {
    if (!input) return
    const fuzzyCreator = new FuzzyIndexCreator()
    const initMapping = fuzzyCreator.initialMapping(input)
    const fuzzyInd = fuzzyCreator.toFuzzyHex(initMapping)
    const res = this.indexTablesDao?.extendAndFuzzySearch({
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
  }

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
  }

  async getDataBase(config) {
    if (config) {
      await this.userDB.getDatabase(config)
      this.docTableDao = this.userDB.DocTableDao
      this.indexTablesDao = this.userDB.IndexTablesDao
      this.PersonalIndexCtr = new PersonalIndexCtr(this.indexTablesDao)
    }
  }

  indexTableIsEmpty() {
    return this.indexTablesDao?.getCount() === 0
  }

  insertIndexData(personalIndexTables) {
    this.indexTablesDao?.insertAll(personalIndexTables)
  }

  getTypeById(did) {
    return this.indexTablesDao?.getTypeById(did)
  }

  deleteIndexByDocId(did) {
    this.indexTablesDao?.deleteIndexByDocId(did)
  }

  getPIByDocId(did) {
    return this.indexTablesDao?.getPIByDocId(did)
  }

  getkTextByDid(docId) {
    return this.indexTablesDao?.getAllkTextByDid(docId)
  }

  getAllDocId() {
    return this.indexTablesDao?.getAllDocId()
  }

  getAllDocByFkey({ kInput, ins_hex }) {
    return this.indexTablesDao?.extendAndFuzzySearch({ kInput, ins_hex })
  }

  getDocById(did) {
    return this.docTableDao?.getDocById?.(did)
  }

  cacheDoc(doc) {
    this.docTableDao?.insertDoc(doc)
  }

  deleteCachedDocById(did) {
    return this.docTableDao?.deleteDocById(did)
  }

  getDocsByIds(relatedDocsIds, sCondition) {
    const result: any[] = []
    for (const did of relatedDocsIds) {
      result.push(this.docTableDao?.getDocById?.(did, sCondition))
    }
    return result
  }

  getDocsByPageId(pageId) {
    return this.docTableDao?.getDocsByPageId(pageId)
  }

  getLastestDocsByType(payload) {
    return this.docTableDao?.getLastestDocsByType(payload?.type)
  }

  getAllDocsByType(payload) {
    return this.docTableDao?.getAllDocsByType(payload?.type)
  }
}

export default IndexRepository
