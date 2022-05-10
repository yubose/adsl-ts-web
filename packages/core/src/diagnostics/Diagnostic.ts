import * as fp from '../utils/fp'
import * as is from '../utils/is'
import * as t from '../types'
import { _symbol } from '../constants'
import type { DiagnosticObject } from './diagnosticsTypes'

class Diagnostic {
  #value: DiagnosticObject

  constructor(value: DiagnosticObject) {
    this.#value = value
  }

  get messages() {
    return this.#value.messages
  }
}

export default Diagnostic
