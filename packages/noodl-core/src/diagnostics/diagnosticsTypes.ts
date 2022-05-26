import type { LiteralUnion } from 'type-fest'
import type { AVisitor, VisitFnArgs, VisitorInitArgs } from '../types'
import type translateDiagnosticType from './translateDiagnosticType'
import type Diagnostic from './Diagnostic'
import type { DiagnosticCode } from '../constants'

export interface IDiagnostics {
  run(options?: RunOptions): Diagnostic[]
  runAsync(options?: RunOptions): Promise<Diagnostic[]>
}

export interface DiagnosticsHelpers<
  M extends Record<string, any> = Record<string, any>,
> {
  add(
    typeOrMessage:
      | DiagnosticLevel
      | DiagnosticObjectMessage
      | DiagnosticObjectMessage[],
    generatorArgsOrMessage?:
      | DiagnosticObjectMessage
      | DiagnosticObjectMessage[]
      | Record<string, any>,
    page?: string,
    node?: any,
  ): void
  error(
    codeOrMessage?:
      | DiagnosticCode
      | Partial<DiagnosticObjectMessage>
      | Record<string, any>
      | string,
    argsOrMessage?: any,
  ): DiagnosticObjectMessage & { type: 'error' }
  info(
    codeOrMessage?:
      | DiagnosticCode
      | Partial<DiagnosticObjectMessage>
      | Record<string, any>
      | string,
    argsOrMessage?: any,
  ): DiagnosticObjectMessage & { type: 'info' }
  warn(
    codeOrMessage?:
      | DiagnosticCode
      | Partial<DiagnosticObjectMessage>
      | Record<string, any>
      | string,
    argsOrMessage?: any,
  ): DiagnosticObjectMessage & { type: 'warn' }
  markers: Markers<M>
}

export type DiagnosticObject<
  H extends Record<string, any> = Record<string, any>,
> = Partial<Pick<VisitFnArgs<H>, 'data' | 'key' | 'page'>> & {
  messages?: DiagnosticObjectMessage[]
}

export interface DiagnosticObjectMessage {
  code?: DiagnosticCode
  type: DiagnosticLevel
  message?: string
}

export type DiagnosticLevel = 'error' | 'info' | 'warn'

export type DefaultMarkerKey = LiteralUnion<
  'appConfig' | 'assetsUrl' | 'baseUrl' | 'pages' | 'preload' | 'rootConfig',
  string
>

export type Markers<O extends Record<string, any> = Record<string, any>> = O & {
  assetsUrl: string
  baseUrl: string
  preload: string[]
  pages: string[]
} & { rootConfig: string; appConfig: string }

export interface RunOptions<
  D extends DiagnosticObject = DiagnosticObject,
  R = D[],
  H extends Record<string, any> = Record<string, any>,
  Asserters = any,
> {
  asserters?: Asserters
  init?: (args: VisitorInitArgs<DiagnosticsHelpers>) => any
  enter?: AVisitor<R, DiagnosticsHelpers & H>['callback']
}
