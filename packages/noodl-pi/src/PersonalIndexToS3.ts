import { isArr } from './utils'
import type IndexDao from './table/IndexDao'
import IndexJson from './IndexJson'

class PersonalIndexToS3<O extends IndexDao<any, any> {
  #indexTablesDao: O

  constructor(indexTablesDao: O) {
    this.#indexTablesDao = indexTablesDao
  }

  DBStoJSON() {
    const objectArray = new Array()
    const res = this.#indexTablesDao?.getAllDocId()
    if (res && res?.length) {
      const { columns, values } = res[0]
      for (const value of values) {
        const docId = value[0]
        const kTextRes = this.#indexTablesDao.getAllkTextByDid(docId)
        const docTypeRes = this.#indexTablesDao.getTypeById(docId)
        // const mTimeRes = this.#indexTablesDao.getmTimeById(docId)
        const kText: any[] = kTextRes[0]['values'].reduce(
          (acc, it) => acc.concat(it),
          [] as any[],
        )
        const docType = docTypeRes[0]['values'][0][0]
        // const mTime = mTimeRes[0]['values'][0][0]
        objectArray.push({
          docType: docType,
          id: docId,
          kText: kText,
        })
      }
      const jsonArray = JSON.stringify(objectArray)
      return jsonArray
    }
    return
  }

  converS3ToDBS(arr) {
    try {
      if (isArr(arr)) {
        for (let i = 0; i < arr.length; i++) {
          let personalIndex = arr[i]
          const indexJson = new IndexJson(
            personalIndex['id'],
            personalIndex['kText'],
            personalIndex['docType'],
          )
          const piList: any[] = indexJson.convertIdxToDoc()
          for (const pi of piList) {
            this.#indexTablesDao.insertAll(pi)
          }
        }
        return true
      }
    } catch (error) {
      console.log(error)
    }
    return false
  }
}

export default PersonalIndexToS3
