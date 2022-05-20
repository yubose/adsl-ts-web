import type { LiteralUnion } from 'type-fest'
import * as fp from '../utils/fp'
import * as is from '../utils/is'
import * as t from '../types'
import Builder from '../Builder'
import Diagnostic from './Diagnostic'
import { translateDiagnosticType } from './utils'
import type {
  IDiagnostics,
  DiagnosticsHelpers,
  DiagnosticObject,
  Markers,
  RunDiagnosticsOptions,
  TranslatedDiagnosticObject,
} from './diagnosticsTypes'

class Diagnostics<
    D extends DiagnosticObject = DiagnosticObject,
    R = D[],
    H extends Record<string, any> = Record<string, any>,
  >
  extends Builder
  implements IDiagnostics
{
  #markers = {
    rootConfig: '',
    appConfig: '',
    preload: [],
    pages: [],
  } as Markers;

  [Symbol.iterator](): Iterator<any, any, any> {
    // @ts-expect-error
    return this.root[Symbol.iterator]()
  }

  constructor() {
    super()
  }

  get markers() {
    return this.#markers
  }

  createDiagnostic(
    opts?: Partial<DiagnosticObject | TranslatedDiagnosticObject>,
  ) {
    const diagnostic = {
      ...fp.omit(opts, ['messages']),
    }

    if (opts?.messages) {
      diagnostic.messages = fp
        .toArr(opts.messages)
        // @ts-expect-error
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

  mark(
    flag: LiteralUnion<'appConfig' | 'page' | 'preload' | 'rootConfig', string>,
    value: any,
  ) {
    if (/preload|page/.test(flag)) {
      this.markers[flag].push(value)
    } else {
      this.markers[flag] = value
    }
    return this
  }

  run(args: RunDiagnosticsOptions<D, R, H> = {}) {
    const { diagnostics, options, originalVisitor } = this.#getRunnerProps(args)
    try {
      for (const nodeProp of this) {
        const { helpers, node } = this.#getVisitorProps({
          beforeEnter: args.beforeEnter,
          diagnostics,
          node: nodeProp,
        })
        this.visitor?.visit(node, { ...options, helpers } as t.VisitorOptions)
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error))
    } finally {
      if (originalVisitor) this.visitor?.use(originalVisitor)
    }

    return diagnostics
  }

  async runAsync(args: RunDiagnosticsOptions<D, R, H> = {}) {
    const { diagnostics, options, originalVisitor } = this.#getRunnerProps(args)
    try {
      await Promise.all(
        [...this].map((nodeProp) => {
          const { helpers, node } = this.#getVisitorProps({
            beforeEnter: args.beforeEnter,
            diagnostics,
            node: nodeProp,
          })
          return this.visitor?.visitAsync(node, {
            ...options,
            helpers,
          } as t.VisitorOptions)
        }),
      )
      return diagnostics
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error))
    } finally {
      if (originalVisitor) this.visitor?.use(originalVisitor)
    }
  }

  #getRunnerProps = (args: RunDiagnosticsOptions<D, R, H>) => {
    let originalVisitor: t.AVisitor<true>['callback'] | undefined

    if (args.enter) {
      originalVisitor = this.visitor?.callback
      this.visitor?.use(args.enter)
    }

    const diagnostics = [] as Diagnostic[]
    const options = {
      init: args.init,
      data: this.createData({ diagnostics }),
      root: this.root as t.ARoot,
    }

    return {
      diagnostics,
      options,
      originalVisitor,
    }
  }

  #getVisitorProps = ({ beforeEnter, diagnostics, node }) => {
    const getHelpers = (
      page: string,
      diag: typeof diagnostics,
    ): DiagnosticsHelpers => {
      return this.createHelpers({
        add: (diagnostic: DiagnosticObject) =>
          void diag.push(this.createDiagnostic({ ...diagnostic, page })),
        markers: this.#markers,
      })
    }

    const helpers = getHelpers(node[0], diagnostics)
    const formattedValue = beforeEnter?.(node)

    return this.createProps({
      helpers,
      node: is.und(formattedValue) ? node : formattedValue,
    })
  }
}

export default Diagnostics
