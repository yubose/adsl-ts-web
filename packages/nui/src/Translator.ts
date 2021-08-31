import * as t from './types'

export interface TranslateFn<K extends string = string> {
  (key: K, fn: () => any): any
}

class NuiTranslator {
  #translate: (...args: Parameters<NuiTranslator['execute']>) => void

  constructor(translate: TranslateFn) {
    this.#translate = translate
  }

  execute(...args: Parameters<TranslateFn>) {
    this.#translate(...args)
  }
}

export default NuiTranslator
