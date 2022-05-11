import type { AVisitor, ARoot } from '../types'
import type { translateDiagnosticType } from './utils'
import { ValidatorType } from '../constants'

export interface IDiagnostics {
  run(
    data: any,
    options?: {
      async?: boolean
      init?: (args: { data: Record<string, any> }) => any
      beforeEnter?: (enterValue: any) => any
      enter?: AVisitor<DiagnosticObject[], DiagnosticsHelpers>['callback']
    },
  ): DiagnosticObject[]
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
> = {
  page: string
  key: null | string | number
  value: any
  path?: any[]
  root: ARoot
  messages: {
    type: ValidatorType
    message: string[]
  }[]
} & O

export type TranslatedDiagnosticObject = Omit<DiagnosticObject, 'messages'> & {
  messages: {
    type: ReturnType<typeof translateDiagnosticType>
    message: string[]
  }
}

export interface DiagnosticsTableObject {
  type: ValidatorType
  code: number
}

export type DiagnosticsMessageTable = Map<string, DiagnosticsTableObject>
