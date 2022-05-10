import type { AVisitor } from '../types'

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
  add(opts: { key: string; value: any; messages: any[] }): void
}

export interface DiagnosticRule {}

export interface DiagnosticObject {
  page: string
  key: string | number
  value: any
  messages: {
    type: 'error' | 'info' | 'warn'
    message: string
  }[]
}

export interface DiagnosticsTableObject {
  type: 'error' | 'warn' | 'info'
  code: number
}

export type DiagnosticsMessageTable = Map<string, DiagnosticsTableObject>
