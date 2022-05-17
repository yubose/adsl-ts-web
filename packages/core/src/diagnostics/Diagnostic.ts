import * as fp from '../utils/fp'
import * as is from '../utils/is'
import * as t from '../types'
import { _symbol } from '../constants'
import type { TranslatedDiagnosticObject } from './diagnosticsTypes'

class Diagnostic {
  #value: TranslatedDiagnosticObject

  constructor(value: TranslatedDiagnosticObject) {
    this.#value = value
  }

  get(key: string) {
    return this.#value[key]
  }

  set(key: string, value: any) {
    this.#value[key] = value
    return this
  }

  get messages() {
    return this.#value.messages
  }

  toJSON() {
    return this.#value
  }

  toString() {
    return JSON.stringify(this.toJSON(), null, 2)
  }
}

export default Diagnostic
