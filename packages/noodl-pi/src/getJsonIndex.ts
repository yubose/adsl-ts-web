import getFuzzyIndexCreator from './getFuzzyIndexCreator'
import type { ExecuteSQL } from './types'

function getJsonIndex(
  run: ExecuteSQL,
  {
    id,
    kText,
    docType,
  }: {
    id: string
    kText: any[]
    docType: number
  },
) {
  const fuzzyIndexCreator = getFuzzyIndexCreator()

  return {
    convertIdxToDoc() {
      let piList: any[] = []

      for (const ktext of kText) {
        const initialMapping = fuzzyIndexCreator.initialMapping(ktext)
        const fKey = fuzzyIndexCreator.toFuzzyInt64(initialMapping)
        const fKeyHex = fuzzyIndexCreator.toFuzzyHex(initialMapping)
        const personalIndex = {
          docId: id,
          docType,
          kText: ktext,
          fKey: fKey,
          fKeyHex: fKeyHex,
          initMapping: initialMapping,
          score: 0,
        }

        piList.push(personalIndex)
      }

      return piList
    },
  }
}

export default getJsonIndex
