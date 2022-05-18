import type { ARoot, DiagnosticsHelpers, VisitFnArgs } from '@noodl/core'
import y from 'yaml'

export type DataObject = ARoot | Map<any, any> | Set<any> | YAMLNode

export interface RunDiagnosticsOptions<N = unknown>
  extends Omit<VisitFnArgs<DiagnosticsHelpers>, 'pageName' | 'value'> {
  node: N
}

export type StringNode = y.Scalar<string> | string

export type YAMLNode = y.Document | y.Document.Parsed | y.Node | y.Pair
