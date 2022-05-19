import type { AVisitor, ARoot } from '../types'
import type { translateDiagnosticType } from './utils'
import { ValidatorType } from '../constants'
import type Diagnostic from './Diagnostic'

export interface IDiagnostics {
  run<Async extends boolean = false>(
    options?: RunDiagnosticsOptions<Async>,
  ): Async extends true ? Promise<Diagnostic[]> : Diagnostic[]
}

export interface RunDiagnosticsOptions<Async extends boolean = false> {
  async?: Async
  init?: (args: { data: Record<string, any> }) => any
  beforeEnter?: (enterValue: any) => any
  enter?: AVisitor<
    Async extends true ? Promise<Diagnostic[]> : Diagnostic[],
    DiagnosticsHelpers
  >['callback']
}

export interface DiagnosticDetails {
  category: string
  code: number
  reportsUnnecessary?: {}
  reportsDeprecated?: {}
  isEarly?: boolean
  elidedInCompatabilityPyramid?: boolean
}

export interface DiagnosticsHelpers {
  add(opts: Partial<DiagnosticObject>): void
}

export interface DiagnosticRule {}

export type DiagnosticObject<
  O extends Record<string, any> = Record<string, any>,
> = O & {
  page: string
  key: number | string | null
  value: any
  path?: any[]
  root: ARoot
  messages: {
    type: ValidatorType
    message: string[]
  }[]
}

export type TranslatedDiagnosticObject = Omit<DiagnosticObject, 'messages'> & {
  messages: {
    type: ReturnType<typeof translateDiagnosticType>
    message: string
  }
}

export interface DiagnosticsTableObject {
  type: ValidatorType
  code: number
}

export type DiagnosticsMessageTable = Map<string, DiagnosticsTableObject>
