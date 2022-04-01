import { isArr } from './utils'
import getJsonIndex from './getJsonIndex'
import type getIndexDaoQueries from './getIndexDaoQueries'
import type { ExecuteSQL } from './types'

function getPersonalIndexToS3Queries(
  run: ExecuteSQL,
  indexDaoQueries: ReturnType<typeof getIndexDaoQueries>,
) {
  return {
    async DBStoJSON() {
      const objectArray = new Array()
      const res = await indexDaoQueries.getAllDocId()
      if (res && res?.length) {
        const { columns, values } = res[0]
        for (const value of values) {
          const docId = value[0]
          const kTextRes = indexDaoQueries.getAllkTextByDid(docId)
          const docTypeRes = indexDaoQueries.getTypeById(docId)
          // const mTimeRes = indexDaoQueries.getmTimeById(docId)
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
    },
    converS3ToDBS(arr: any[]) {
      try {
        if (isArr(arr)) {
          for (let i = 0; i < arr.length; i++) {
            let personalIndex = arr[i]
            const indexJson = getJsonIndex(run, {
              id: personalIndex.id,
              kText: personalIndex.kText,
              docType: personalIndex.docType,
            })
            const piList: any[] = indexJson.convertIdxToDoc()
            for (const pi of piList) indexDaoQueries.insertAll(pi)
          }
          return true
        }
      } catch (error) {
        console.log(error)
      }
      return false
    },
  }
}

export default getPersonalIndexToS3Queries
