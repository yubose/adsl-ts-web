import type { LiteralUnion } from 'type-fest'
import * as fp from '../utils/fp'
import * as t from '../types'
import AppConfig from '../AppConfig'
import RootConfig from '../RootConfig'
import Builder from '../Builder'
import Diagnostic from './Diagnostic'
import * as regex from '../utils/regex'
import * as is from '../utils/is'
import { isValidViewTag } from '../utils/noodl'
import { DiagnosticCode, ValidatorType } from '../constants'
import { generateDiagnostic, isDiagnosticLevel } from './utils'
import type {
  IDiagnostics,
  DefaultMarkerKey,
  DiagnosticLevel,
  DiagnosticsHelpers,
  DiagnosticObject,
  DiagnosticObjectMessage,
  Markers,
  RunOptions,
} from './diagnosticsTypes'

function createMessageByTypeAndDiagnosticCodeAndArgs(
  type: DiagnosticLevel,
  code: DiagnosticCode,
  args?: Record<string, any>,
) {
  return fp.merge({ type }, generateDiagnostic(code, args))
}

function createMessageByDiagnosticCodeAndArgs(
  code: DiagnosticCode,
  args?: Record<string, any>,
) {
  return fp.merge({ type: 'info' }, generateDiagnostic(code, args))
}

function createMessage(
  type: DiagnosticLevel,
  code?: DiagnosticCode,
  argsOrMessage?: Record<string, any> | string,
): DiagnosticObjectMessage

function createMessage(
  code: DiagnosticCode,
  argsOrMessage?: Record<string, any> | string,
): DiagnosticObjectMessage

function createMessage(
  message: DiagnosticObjectMessage | string,
): DiagnosticObjectMessage

function createMessage(
  typeOrCode:
    | DiagnosticCode
    | DiagnosticLevel
    | DiagnosticObjectMessage
    | string,
  argsOrCodeOrMsg?: DiagnosticCode | Record<string, any> | string,
  argsOrMsg?: Record<string, any> | string,
) {
  if (is.obj(typeOrCode)) return typeOrCode
  if (isDiagnosticLevel(typeOrCode)) {
    return createMessageByTypeAndDiagnosticCodeAndArgs(
      typeOrCode,
      argsOrCodeOrMsg as DiagnosticCode,
      argsOrMsg as Record<string, any>,
    )
  } else if (is.num(typeOrCode)) {
    return createMessageByDiagnosticCodeAndArgs(
      typeOrCode,
      argsOrCodeOrMsg as Record<string, any>,
    )
  }
  return { type: 'info', message: typeOrCode }
}

class Diagnostics<
    D extends DiagnosticObject = DiagnosticObject,
    R = D[],
    H extends Record<string, any> = Record<string, any>,
    Asserters = any,
  >
  extends Builder
  implements IDiagnostics
{
  #appConfig: AppConfig
  #rootConfig: RootConfig
  #markers = { rootConfig: '', appConfig: '' } as Markers;

  [Symbol.iterator](): Iterator<[name: string, node: unknown], any, any> {
    // @ts-expect-error
    return this.root[Symbol.iterator]()
  }

  constructor() {
    super()
    this.#rootConfig = new RootConfig()
    this.#appConfig = new AppConfig()
  }

  get rootConfig() {
    return this.#rootConfig
  }

  get appConfig() {
    return this.#appConfig
  }

  get markers() {
    this.#markers.assetsUrl = this.#appConfig.assetsUrl
    this.#markers.baseUrl = this.#rootConfig.cadlBaseUrl
    this.#markers.preload = this.#appConfig.preload
    this.#markers.pages = this.#appConfig.page
    return this.#markers
  }

  createDiagnostic(page?: string, node?: any) {
    const diagnostic = new Diagnostic()
    if (page) diagnostic.set('page', page)
    return diagnostic
  }

  mark(flag: DefaultMarkerKey, value: any) {
    if (/preload|page/.test(flag)) {
      this.#appConfig[flag === 'pages' ? 'page' : flag].push(value)
    } else if (flag === 'baseUrl') {
      this.#rootConfig.cadlBaseUrl = value
    } else if (flag === 'assetsUrl') {
      this.#appConfig.assetsUrl = value
    } else {
      this.markers[flag] = value
    }
    return this
  }

  run(args: RunOptions<D, R, H, Asserters> = {}) {
    const asserters = fp.toArr(args?.asserters ?? []).filter(Boolean)
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
          asserters,
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

  async runAsync(args: RunOptions<D, R, H, Asserters> = {}) {
    const asserters = fp.toArr(args?.asserters ?? []).filter(Boolean)
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
            asserters,
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

  #getRunnerProps = <Asserters = any>(args: RunOptions<D, R, H, Asserters>) => {
    let originalVisitor: t.AVisitor<true>['callback'] | undefined =
      this.visitor?.callback?.(args as any)

    if (args.enter) {
      originalVisitor = this.visitor?.callback
      this.visitor?.use(args.enter)
    } else {
      this.visitor?.use((args) => originalVisitor?.(args))
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
        add: (
          ...[typeOrMessages, generatorArgsOrMessage, ...rest]: Parameters<
            DiagnosticsHelpers['add']
          >
        ) => {
          const diagnostic = this.createDiagnostic(page, ...args)
          diag.push(diagnostic)
        },
        error: (...args) => createMessage('error', ...args),
        info: (...args) => createMessage('info', ...args),
        warn: (...args) => createMessage('warn', ...args),
        isValidPageValue: (page: string) => {
          if (!page) return false
          if (!regex.letters.test(page)) return false
          if (/null|undefined/i.test(page)) return false
          if (['.', '_', '-'].some((symb) => symb === page)) return false
          return true
        },
        isValidViewTag,
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
