import * as fp from '../utils/fp'
import * as is from '../utils/is'
import * as t from '../types'
import Builder from '../Builder'
import { _symbol } from '../constants'
import Diagnostic from './Diagnostic'
import type {
  IDiagnostics,
  DiagnosticsHelpers,
  DiagnosticObject,
  DiagnosticRule,
} from './diagnosticsTypes'

export interface RunOptions {
  async?: boolean
  init?: (args: { data: Record<string, any> }) => any
  beforeEnter?: (enterValue: any) => any
  enter?: t.AVisitor<DiagnosticObject[], DiagnosticsHelpers>['callback']
}

class Diagnostics extends Builder implements IDiagnostics {
  [Symbol.iterator](): Iterator<any, any, any> {
    // @ts-expect-error
    return this.iterator?.getIterator(this.iterator.getItems(this.data))
  }

  rules = [] as Diagnostic[]

  constructor() {
    super()
  }

  run(data?: any, opts?: RunOptions & { async: true }): Promise<any>
  run(data?: any, opts?: RunOptions): any
  run(
    data?: any,
    { beforeEnter, init, enter, async = false }: RunOptions = {},
  ) {
    this.data = data

    let prevVisitCallback: t.AVisitor['callback'] | undefined

    if (enter) {
      prevVisitCallback = this.visitor?.callback
      this.visitor?.use(enter)
    }

    const diagnostics = [] as Diagnostic[]
    const options = { init, data: this.createData({ diagnostics }) }

    const getVisitorProps = (value: any) => {
      const getHelpers = (
        name: string,
        diag: typeof diagnostics,
      ): DiagnosticsHelpers => {
        return this.createHelpers({
          add: ({ key, value, messages }) =>
            void diag.push(
              this.createDiagnostic({
                page: name,
                key,
                value,
                messages: messages.map((obj) => ({
                  type: obj?.type || 'info',
                  message: obj?.message || '',
                })),
              }),
            ),
        })
      }

      const helpers = getHelpers(value[0], diagnostics)
      const formattedValue = beforeEnter?.(value)

      return this.createProps({
        helpers,
        value: is.und(formattedValue) ? value : formattedValue,
      })
    }

    try {
      if (async) {
        return new Promise(async (resolve, reject) => {
          try {
            await Promise.all(
              [...this].map((value) => {
                const visitorProps = getVisitorProps(value)
                return this.visitor?.visitAsync(visitorProps.value, {
                  ...options,
                  ...visitorProps.helpers,
                })
              }),
            )
            resolve(diagnostics)
          } catch (error) {
            reject(error instanceof Error ? error : new Error(String(error)))
          }
        })
      } else {
        for (const value of this) {
          const visitorProps = getVisitorProps(value)
          this.visitor?.visit(visitorProps.value, {
            ...options,
            ...visitorProps.helpers,
          })
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      throw err
    } finally {
      if (prevVisitCallback) this.visitor?.use(prevVisitCallback)
    }

    return diagnostics
  }

  register(value: DiagnosticRule) {
    if (is.diagnostic(value)) {
      const diagnostic = new Diagnostic(value)
      this.rules.push(diagnostic)
    } else {
      super.use(value)
    }
    return this
  }

  createDiagnostic(opts?: { title: string; type: 'error' | 'warn' | 'info' }) {
    const diagnostic = { ...opts } as DiagnosticObject

    Object.defineProperty(diagnostic, '_id_', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: _symbol.diagnostic,
    })

    return new Diagnostic(diagnostic)
  }
}

export default Diagnostics
