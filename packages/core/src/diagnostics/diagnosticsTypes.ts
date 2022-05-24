import type { LiteralUnion } from 'type-fest'
import type { AVisitor, VisitFnArgs, VisitorInitArgs } from '../types'
import type { translateDiagnosticType } from './utils'
import type Diagnostic from './Diagnostic'

export interface IDiagnostics {
  run(options?: RunOptions): Diagnostic[]
  runAsync(options?: RunOptions): Promise<Diagnostic[]>
}

export interface DiagnosticsHelpers<
  M extends Record<string, any> = Record<string, any>,
> {
  add(opts: Partial<DiagnosticObject>): void
  markers: Markers<M>
}

export type DiagnosticObject<
  H extends Record<string, any> = Record<string, any>,
> = VisitFnArgs<H> & {
  messages?: DiagnosticObjectMessage[]
}

export interface DiagnosticObjectMessage {
  type: ReturnType<typeof translateDiagnosticType>
  message?: string
}

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
> {
  init?: (args: VisitorInitArgs<DiagnosticsHelpers>) => any
  enter?: AVisitor<R, DiagnosticsHelpers & H>['callback']
}

export type TranslatedDiagnosticObject<
  D extends DiagnosticObject = DiagnosticObject,
> = Omit<D, 'messages'> & {
  messages: DiagnosticObjectMessage[]
}
