import FuzzyIndexCreator from './IndexCreator'

class IndexJson {
  #fuzzyIndexCreator = new FuzzyIndexCreator()
  id: string
  kText: any[]
  docType: number

  constructor(id: string, kText: any[], docType: number) {
    this.id = id
    this.kText = kText
    this.docType = docType
  }

  convertIdxToDoc() {
    let piList: any[] = []

    for (const ktext of this.kText) {
      const initialMapping = this.#fuzzyIndexCreator.initialMapping(ktext)
      const fKey = this.#fuzzyIndexCreator.toFuzzyInt64(initialMapping)
      const fKeyHex = this.#fuzzyIndexCreator.toFuzzyHex(initialMapping)
      const personalIndex = {
        docId: this.id,
        docType: this.docType,
        kText: ktext,
        fKey: fKey,
        fKeyHex: fKeyHex,
        initMapping: initialMapping,
        score: 0,
      }

      piList.push(personalIndex)
    }

    return piList
  }
}

export default IndexJson
