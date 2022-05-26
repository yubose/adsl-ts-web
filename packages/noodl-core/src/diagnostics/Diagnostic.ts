import { _symbol, DiagnosticCode } from '../constants'
import type { DiagnosticObject } from './diagnosticsTypes'

class Diagnostic {
  #value = { messages: [] } as DiagnosticObject;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toJSON()
  }

  constructor() {
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
    return this.#value.messages as NonNullable<DiagnosticObject['messages']>
  }

  set messages(messages) {
    this.#value.messages = messages
  }

  error(code: DiagnosticCode, message: string) {
    this.messages.push({ type: 'error', code, message })
    return this
  }

  info(code: DiagnosticCode, message: string) {
    this.messages.push({ type: 'info', code, message })
    return this
  }

  warn(code: DiagnosticCode, message: string) {
    this.messages.push({ type: 'warn', code, message })
    return this
  }

  toJSON() {
    return this.#value
  }

  toString() {
    return JSON.stringify(this.toJSON(), null, 2)
  }
}

export default Diagnostic
