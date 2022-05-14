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

export interface RunOptions<Async = false> {
  async?: Async
  init?: (args: { data: Record<string, any> }) => any
  beforeEnter?: (enterValue: any) => any
  enter?: t.AVisitor<DiagnosticObject[], DiagnosticsHelpers>['callback']
}

class Diagnostics extends Builder implements IDiagnostics {
  [Symbol.iterator](): Iterator<any, any, any> {
    // @ts-expect-error
    return this.root[Symbol.iterator]()
  }

  rules = [] as Diagnostic[]

  constructor() {
    super()
  }

  // @ts-expect-error
  run(opts?: RunOptions<true>): Promise<Diagnostic[]>

  run(opts?: RunOptions<false | undefined | never | void>): Diagnostic[]

  run<Async extends boolean = boolean>({
    beforeEnter,
    init,
    enter,
    async = false as Async,
  }: RunOptions<Async> = {}) {
    let prevVisitCallback: t.AVisitor<Async>['callback'] | undefined

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
              [...this].map((val) => {
                const { helpers, value } = getVisitorProps(val)
                return this.visitor?.visitAsync(value, {
                  ...options,
                  ...helpers,
                })
              }),
            )
            resolve(diagnostics as any)
          } catch (error) {
            reject(error instanceof Error ? error : new Error(String(error)))
          }
        }) as Async extends true ? Promise<Diagnostics[]> : Diagnostics[]
      } else {
        for (const val of this) {
          const { helpers, value } = getVisitorProps(val)
          this.visitor?.visit(value, {
            ...options,
            ...helpers,
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

    if (opts?.messages) {
      diagnostic.messages = fp
        .toArr(opts.messages)
        .map(({ message, type, ...rest }) => {
          return {
            message,
            type: translateDiagnosticType(type),
            ...rest,
          }
        })
    }

    return new Diagnostic(diagnostic as TranslatedDiagnosticObject)
  }
}

export default Diagnostics
