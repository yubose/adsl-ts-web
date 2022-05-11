import * as fp from '../utils/fp'
import * as is from '../utils/is'
import * as t from '../types'
import Builder from '../Builder'
import { _symbol } from '../constants'
import Diagnostic from './Diagnostic'
import { translateDiagnosticType } from './utils'
import type {
  IDiagnostics,
  DiagnosticsHelpers,
  DiagnosticObject,
  DiagnosticRule,
  TranslatedDiagnosticObject,
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
    // return this.iterator?.getIterator(this.iterator.getItems(this.data))
    // return this.iterator?.getIterator(this.root?.value)
    return this.root[Symbol.iterator]()
  }

  rules = [] as Diagnostic[]

  constructor() {
    super()
  }

  run(opts?: RunOptions & { async: true }): Promise<any>
  run(opts?: RunOptions): any
  run({ beforeEnter, init, enter, async = false }: RunOptions = {}) {
    let prevVisitCallback: t.AVisitor['callback'] | undefined

    if (enter) {
      prevVisitCallback = this.visitor?.callback
      this.visitor?.use(enter)
    }

    const diagnostics = [] as Diagnostic[]
    const options = {
      init,
      data: this.createData({ diagnostics }),
      root: this.root,
    }

    const getVisitorProps = (value: any) => {
      const getHelpers = (
        name: string,
        diag: typeof diagnostics,
      ): DiagnosticsHelpers => {
        return this.createHelpers({
          add: (diagnostic: DiagnosticObject) =>
            void diag.push(
              this.createDiagnostic({ ...diagnostic, page: name }),
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
                const props = getVisitorProps(value)
                return this.visitor?.visitAsync(props.value, {
                  ...options,
                  ...props.helpers,
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
          const props = getVisitorProps(value)
          this.visitor?.visit(props.value, {
            ...options,
            ...props.helpers,
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

  register(value: Parameters<Builder['use']>[0] | TranslatedDiagnosticObject) {
    if (is.diagnostic(value)) {
      const diagnostic = new Diagnostic(value)
      this.rules.push(diagnostic)
    } else {
      super.use(value)
    }
    return this
  }

  createDiagnostic(
    opts?: Partial<DiagnosticObject | TranslatedDiagnosticObject>,
  ) {
    const diagnostic = {
      ...fp.omit(opts, ['messages']),
    }

    Object.defineProperty(diagnostic, '_id_', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: _symbol.diagnostic,
    })

    if (diagnostic.messages) {
      diagnostic.messages = fp
        .toArr(diagnostic.messages)
        .map(({ message, type }) => {
          return {
            message,
            type: translateDiagnosticType(type),
          }
        })
    }

    return new Diagnostic(diagnostic as TranslatedDiagnosticObject)
  }
}

export default Diagnostics
