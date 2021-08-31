import * as u from '@jsmanifest/utils'
import NuiTranslator, { TranslateFn } from './Translator'
import * as t from './types'

class Translators {
  #translators = new Map<string, t.Resolve.TranslateConfig[]>()

  get translators() {
    return this.#translators
  }

  add<C extends t.Resolve.TranslateConfig>(translator: C) {
    let curr = this.#translators.get(
      translator.key,
    ) as t.Resolve.TranslateConfig[]
    let key = translator.key
    if (!curr) {
      curr = []
      this.translators.set(key, curr)
    }
    !curr.includes(translator) && curr.push(translator)
    this.translators.set(key, curr)
  }

  remove(translator: string | t.Resolve.TranslateConfig) {
    if (u.isStr(translator)) {
      //
    } else {
      if (this.#translators.includes(translator)) {
        this.#translators.splice(this.#translators.indexOf(translator), 1)
      }
    }
  }

  execute<K extends string = string>(key: K) {
    for (const translate of this.#translators) {
      translate.execute(key)
    }
  }
}

const translators = new Translators()

translators.add()

export default translators
