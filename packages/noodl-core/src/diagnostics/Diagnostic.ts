import type { TranslatedDiagnosticObject } from './diagnosticsTypes'
import { _symbol } from '../constants'

class Diagnostic {
  #value: TranslatedDiagnosticObject;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toJSON()
  }

  constructor(value: TranslatedDiagnosticObject) {
    this.#value = value
    Object.defineProperty(this, '_id_', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: _symbol.diagnostic,
    })
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
