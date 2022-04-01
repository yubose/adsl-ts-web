// @ts-nocheck
// import { documentToNote, contentToBlob } from '../../../services/document/utils'
// import PItoS3Helper from '../S3Convert/PItoS3Helper'
// import basicExtraction from '../KeyExtraction/BasicAlgorithm'
import getFuzzyIndexCreator from './getFuzzyIndexCreator'
import { replaceUint8ArrayWithBase64, toArr } from './utils'
import type getIndexDaoQueries from './getIndexDaoQueries'
import type { ExecuteSQL } from './types'

function getPersonalIndexCtr(
  run: ExecuteSQL,
  indexDao: ReturnType<typeof getIndexDaoQueries>,
) {
  let mTime = 0
  let user_vid = ''
  let isadmin = false
  let rootNoteBookId = ''
  let PI_docID = ''

  const o = {
    /**
     * backupPI
     */
    async backUpPI<O extends Record<string, any> = Record<string, any>>(
      piDoc?: O,
    ) {
      const user_vid = o.getUser_Vid()
      const pItoS3Helper = new PItoS3Helper(indexDao)
      const context = pItoS3Helper.DBStoJSON()
      let uploadResponse
      const requestOptions: any = { context }
      if (piDoc) {
        requestOptions.eid = piDoc?.eid
        requestOptions.id = piDoc?.id
      } else {
        const response = await o.retrievePersonalIndex(user_vid)
        if (response.code != 0) {
          console.log(
            'Retrieve personal index failed with code ' + response.code,
          )
          return false
        }
        const docs = response?.document
        if (context && docs && docs.length) {
          piDoc = docs[0]
          requestOptions.eid = piDoc?.eid
          requestOptions.id = piDoc?.id
        }
      }
      if (!piDoc) requestOptions.eid = rootNoteBookId
      uploadResponse = await o.uploadPersonalIndex(requestOptions)
      return uploadResponse
    },
    /**
     * retrievePersonalIndex
     */
    async retrievePersonalIndex(user_vid) {
      const idList = [rootNoteBookId]
      const requestOptions: any = {
        xfname: 'eid',
        type: '1793',
        obfname: 'mtime',
      }
      let rawResponse
      await store.level2SDK.documentServices
        .retrieveDocument({
          idList,
          options: requestOptions,
        })
        .then(async (res) => {
          rawResponse = res.data
          const documents = u
            .array(res?.data?.document)
            .reduce(
              (acc, obj) => (obj != null ? acc.concat(obj) : acc),
              [] as any[],
            )

          return Promise.allSettled(
            documents.map?.(async (document) => {
              //decrypt data
              if (document?.deat?.url) {
                //skip files that are in S3
                //these will be retrieved as needed by noodl established prepareDoc util fn
                return document
              } else {
                let note: any
                try {
                  note = await documentToNote({ document })
                } catch (error) {
                  const err =
                    error instanceof Error ? error : new Error(String(error))
                  console.error(err, { note, error: err, document })
                }
                return note
              }
            }),
          )
        })
        .then((res) => {
          delete rawResponse.document
          rawResponse.document = res.reduce((acc, result) => {
            // @ts-expect-error
            const { status, value: doc } = result
            return status === 'fulfilled' && doc != null ? acc.concat(doc) : acc
          }, [] as any[])
        })

      return rawResponse
    },
    /**
     * uploadPersonalIndex
     */
    async uploadPersonalIndex(requestOptions: {
      content: any
      eid: string
      id?: Uint8Array | string
    }) {
      let response

      const blob = await contentToBlob(
        requestOptions?.content,
        'application/json',
      )
      if (requestOptions?.id) {
        response = await store.level2SDK.documentServices.updateDocument({
          id: requestOptions?.id,
          fid: requestOptions?.id,
          eid: requestOptions?.eid,
          subtype: 2,
          // name:,
          size: blob.size,
          type: 1793,
        })
      } else {
        response = await store.level2SDK.documentServices.createDocument({
          eid: requestOptions?.eid,
          type: 1793,
          subtype: 2,
          size: blob.size,
          // name: {}
        })
      }
      if (response?.code === 0) {
        await o.uploadFileToS3_low(
          response?.data?.document,
          requestOptions?.content,
        )
      }
      return response
    },
    async uploadFileToS3_low(doc, bs64Data) {
      const deat = doc?.deat
      if (deat !== null && deat && deat.url && bs64Data) {
        const res = await store.level2SDK.documentServices
          .uploadDocumentToS3({ url: deat.url, sig: deat.sig, data: bs64Data })
          .then(store.responseCatcher)
          .catch(store.errorCatcher)
      }
    },
    async getPIData(doc) {
      const subtype = doc.subtype
      if (subtype?.isOnServer) {
        console.log('personal index should not be on server')
      } else {
        const deat = doc?.deat
        const url = deat?.url
        try {
          if (deat && url) {
            const response =
              await store.level2SDK.documentServices.downloadDocumentFromS3({
                url,
              })
            const content = response?.data
            return content
          }
        } catch (error) {
          console.log(error)
        }
      }

      return null
    },
    /**
     * restorePI
     */
    async restorePI() {
      if (!indexDao.indexTableIsEmpty) {
        console.log('Local Index Table is not empty, skipping the restore')
        return false
      }
      console.log('Index Table is empty.. going to check from S3')
      const user_vid = o.getUser_Vid()
      const response = await o.retrievePersonalIndex(user_vid)
      if (response.code != 0) {
        console.log('Retrieve personal index failed with code ' + response.code)
        return false
      }
      const docs = response?.document
      let piDoc
      if (docs && docs.length) {
        piDoc = docs[0]
        const jsonStr = await o.getPIData(piDoc)
        if (jsonStr == null) {
          console.log('getPIData failed')
        }
        o.PI_docID = jsonStr[0]?.id
        const pItoS3Helper = new PItoS3Helper(indexDao)
        pItoS3Helper.converS3ToDBS(jsonStr)
        console.log('restorePI success')
      } else {
        console.log('restorePI did not find a document')
      }
      const isFinishedInsert = await o.updatePI_mtime()
      await o.backUpPI(piDoc)
      return true
    },
    /**
     * retrieveLatestDoc
     */
    async retrieveLatestDoc(user_vid, lastestDocId: string) {
      const idList = [user_vid]
      const requestOptions: any = {
        ObjType: 1344,
        scondition: `E.type>9999 AND D.type not in (1793)`,
        asc: false,
        obfname: 'D.mtime',
        loid: lastestDocId,
      }
      let rawResponse
      await store.level2SDK.documentServices
        .retrieveDocument({
          idList,
          options: requestOptions,
        })
        .then(async (res) => {
          rawResponse = res.data
          const documents = toArr(res?.data?.document).reduce(
            (acc, obj) => (obj != null ? acc.concat(obj) : acc),
            [] as any[],
          )

          return Promise.allSettled(
            documents.map?.(async (document) => {
              //decrypt data
              if (document?.deat?.url) {
                //skip files that are in S3
                //these will be retrieved as needed by noodl established prepareDoc util fn
                return document
              } else {
                let note: any
                try {
                  note = await documentToNote({ document })
                } catch (error) {
                  const err =
                    error instanceof Error ? error : new Error(String(error))
                  console.error(err, { note, error: err, document })
                }
                return note
              }
            }),
          )
        })
        .then((res) => {
          delete rawResponse.document
          rawResponse.document = res.reduce((acc, result) => {
            const { status, value: doc } = result
            return status === 'fulfilled' && doc != null ? acc.concat(doc) : acc
          }, [] as any[])
        })
        .catch((error) => {
          console.error(
            error instanceof Error ? error : new Error(String(error)),
          )
        })
      return rawResponse
    },
    getPI_mtime() {
      return indexDao.getPI_mtime()
    },
    async updatePI_mtime() {
      const lastestDocId = indexDao.getLatestDocId()
      const newTime = new Date().getTime()
      const user_vid = o.getUser_Vid()
      const rawResponse = await o.retrieveLatestDoc(user_vid, lastestDocId)
      o.mTime = newTime
      return o.insertIndexTable(rawResponse)
    },
    insertIndexTable(response) {
      if (response?.document?.length) {
        const docs = response?.document
        for (const item of toArr(docs).filter(Boolean)) {
          const content = item?.name?.data
          const contentAfterExtraction = basicExtraction(content)

          const fuzzyIndexCreator = getFuzzyIndexCreator()
          let docId = item?.id
          if (docId instanceof Uint8Array) {
            docId = store.level2SDK.utilServices.uint8ArrayToBase64(docId)
          }
          console.log('insert doc', { item })
          for (const key of contentAfterExtraction) {
            const initialMapping = fuzzyIndexCreator.initialMapping(key)
            const fKey = fuzzyIndexCreator.toFuzzyInt64(initialMapping)
            //const fKeyHex = fuzzyIndexCreator.toFuzzyHex(initialMapping)
            const queryRes = indexDao.getPIByDocId(item?.id)
            if (queryRes.length) {
              const [cols, values] = queryRes[0]
              indexDao.deleteIndexByDocId(item?.id)
              indexDao.insertAll({
                kText: key,
                docId,
                docType: item.type,
                fKey,
                score: 0,
              })
            } else {
              indexDao.insertAll({
                kText: key,
                docId,
                docType: item.type,
                fKey,
                score: 0,
                mtime: item.mtime,
              })
            }

            //console.log('insert to index table!!!', fKey, initialMapping, fKeyHex)
          }
        }
        return true
      }
      return false
    },
    getUser_Vid() {
      user_vid = localStorage.getItem('facility_vid')
        ? localStorage.getItem('facility_vid')
        : localStorage.getItem('user_vid')
      return user_vid
    },
    async isAdmin() {
      const user_vid = o.getUser_Vid()
      const idList = [user_vid]
      const requestOptions: any = {
        ObjType: '4',
        scondition: 'E.type in (1100,1200) AND V.type=20',
        xfname: 'E.bvid',
        ids: idList,
      }
      await store.level2SDK.vertexServices
        .retrieveVertex({
          idList: [],
          options: requestOptions,
        })
        .then((res) => {
          const vertexs = res?.data?.vertex
          if (vertexs && vertexs.length) {
            isadmin = true
            // o.setRootNoteBookId(o.getAdminConnectedEdgeId())
          }
        })
      return isadmin
    },
    //get 110 or 1200edge
    async getAdminConnectedEdgeId() {
      const facility_vid = localStorage.getItem('facility_vid')
      const user_vid = localStorage.getItem('user_vid')
      const idList: any[] = [user_vid, facility_vid]
      const requestOptions: any = {
        scondition: 'type in (1100,1200)',
        xfname: 'bvid,evid',
        // ids: idList,
      }
      let rawResponse
      let eid
      await store.level2SDK.edgeServices
        .retrieveEdge({
          idList,
          options: requestOptions,
        })
        .then((res) => {
          const edge = res?.data?.edge
          if (edge && edge.length) {
            rawResponse = edge[0]
            rawResponse = replaceUint8ArrayWithBase64(rawResponse)
            eid = rawResponse?.eid
          }
        })

      return eid
    },
    setRootNoteBookId(_rootNoteBookId: string) {
      rootNoteBookId = _rootNoteBookId
    },
  }

  return o
}

export default getPersonalIndexCtr
