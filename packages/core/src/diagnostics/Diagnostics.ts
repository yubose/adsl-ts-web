import * as fp from '../utils/fp'
import * as t from '../types'
import Builder from '../Builder'
import Diagnostic from './Diagnostic'
import { translateDiagnosticType } from './utils'
import type {
  IDiagnostics,
  DefaultMarkerKey,
  DiagnosticsHelpers,
  DiagnosticObject,
  Markers,
  RunOptions,
  TranslatedDiagnosticObject,
} from './diagnosticsTypes'
import { ValidatorType } from '../constants'

class Diagnostics<
    D extends DiagnosticObject = DiagnosticObject,
    R = D[],
    H extends Record<string, any> = Record<string, any>,
  >
  extends Builder
  implements IDiagnostics
{
  #markers = {
    assetsUrl: '',
    baseUrl: '',
    rootConfig: '',
    appConfig: '',
    preload: [],
    pages: [],
  } as Markers;

  // rules = [] as DiagnosticAssert[];

  [Symbol.iterator](): Iterator<[name: string, node: unknown], any, any> {
    // @ts-expect-error
    return this.root[Symbol.iterator]()
  }

  constructor() {
    super()
  }

  get markers() {
    return this.#markers
  }

  // assert(fn: DiagnosticAssertFn) {
  //   const assert = new DiagnosticAssert(fn)
  //   this.rules.push(assert)
  //   return this
  // }

  createDiagnostic(
    opts?: Partial<DiagnosticObject | TranslatedDiagnosticObject>,
  ) {
    const diagnostic = fp.omit(opts, ['messages']) as DiagnosticObject

    if (opts?.messages) {
      diagnostic.messages = fp
        .toArr(opts.messages)
        .map(({ message, type, ...rest }) => {
          return {
            message,
            type: translateDiagnosticType(type as ValidatorType),
            ...rest,
          }
        })
    }

    return new Diagnostic(diagnostic as TranslatedDiagnosticObject)
  }

  mark(flag: DefaultMarkerKey, value: any) {
    if (/preload|page/.test(flag)) {
      this.markers[flag === 'preload' ? flag : 'pages'].push(value)
    } else {
      this.markers[flag] = value
    }
    return this
  }

  run(args: RunOptions<D, R, H> = {}) {
    const { diagnostics, options, originalVisitor } = this.#getRunnerProps(args)
    try {
      for (const [name, nodeProp] of this) {
        const { helpers, node } = this.#getVisitorProps({
          diagnostics,
          name,
          node: nodeProp,
        })
        this.visitor?.visit(node, {
          ...options,
          helpers,
          page: name,
        } as t.VisitorOptions)
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error))
    } finally {
      if (originalVisitor) this.visitor?.use(originalVisitor)
    }

    return diagnostics
  }

  print(diagnostics: Diagnostic[]) {
    console.dir(
      diagnostics.map((diagnostic) => diagnostic.toJSON()),
      { depth: Infinity },
    )
  }

  async runAsync(args: RunOptions<D, R, H> = {}) {
    // let composedAssert

    // if (args.rules) {
    //   composedAssert = composeAsyncRules<D, R, H, Control>(...args.rules)
    // }

    const { diagnostics, options, originalVisitor } = this.#getRunnerProps(args)
    try {
      await Promise.all(
        [...this].map(([name, nodeProp]) => {
          const { helpers, node } = this.#getVisitorProps({
            diagnostics,
            name,
            node: nodeProp,
          })
          return this.visitor?.visitAsync(node, {
            ...options,
            page: name,
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

  #getRunnerProps = (args: RunOptions<D, R, H>) => {
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

  #getVisitorProps = ({
    diagnostics,
    name,
    node,
  }: {
    diagnostics: Diagnostic[]
    name: string
    node: unknown
  }) => {
    const getHelpers = (
      page: string,
      diag: typeof diagnostics,
    ): DiagnosticsHelpers => {
      return this.createHelpers({
        add: (diagnostic: DiagnosticObject) => {
          diag.push(this.createDiagnostic({ ...diagnostic, node, page }))
        },
        markers: this.#markers,
      })
    }

    const helpers = getHelpers(name, diagnostics)

    return this.createProps({
      helpers,
      name,
      node,
    })
  }
}

export default Diagnostics
