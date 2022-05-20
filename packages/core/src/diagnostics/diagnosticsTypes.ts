import type { AVisitor, VisitFnArgs, VisitorInitArgs } from '../types'
import type { translateDiagnosticType } from './utils'
import { ValidatorType } from '../constants'
import type Diagnostic from './Diagnostic'

export interface IDiagnostics {
  run(options?: RunDiagnosticsOptions): Diagnostic[]
  runAsync(options?: RunDiagnosticsOptions): Promise<Diagnostic[]>
}

export interface RunDiagnosticsOptions<
  D extends DiagnosticObject = DiagnosticObject,
  R = D[],
  H extends Record<string, any> = Record<string, any>,
> {
  init?: (args: VisitorInitArgs<DiagnosticsHelpers>) => any
  beforeEnter?: (enterValue: any) => any
  enter?: AVisitor<R, DiagnosticsHelpers & H>['callback']
}

export interface DiagnosticDetails {
  category: string
  code: number
  reportsUnnecessary?: {}
  reportsDeprecated?: {}
  isEarly?: boolean
  elidedInCompatabilityPyramid?: boolean
}

export interface DiagnosticsHelpers<
  M extends Record<string, any> = Record<string, any>,
> {
  add(opts: Partial<DiagnosticObject>): void
  markers: Markers<M>
}

export interface DiagnosticRule {}

export type DiagnosticObject<
  H extends Record<string, any> = Record<string, any>,
> = VisitFnArgs<H> & {
  messages?: DiagnosticObjectMessage[]
}

export interface DiagnosticObjectMessage {
  type: ReturnType<typeof translateDiagnosticType>
  message?: string
}

export type TranslatedDiagnosticObject<
  D extends DiagnosticObject = DiagnosticObject,
> = Omit<D, 'messages'> & {
  messages: Record<string, any> & {
    type: ReturnType<typeof translateDiagnosticType>
    message: string
  }
}

export interface DiagnosticsTableObject {
  type: ValidatorType
  code: number
}

export type DiagnosticsMessageTable = Map<string, DiagnosticsTableObject>

export type Markers<O extends Record<string, any> = Record<string, any>> = O & {
  preload: string[]
  pages: string[]
} & { rootConfig: string; appConfig: string }
