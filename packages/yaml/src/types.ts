import type { ARoot, DiagnosticsHelpers, VisitFnArgs } from '@noodl/core'
import y from 'yaml'

export type DataObject = ARoot | Map<any, any> | Set<any> | YAMLNode

export interface RunDiagnosticsOptions<N = unknown>
  extends Omit<VisitFnArgs<DiagnosticsHelpers>, 'pageName' | 'value'> {
  node: N
}

export type StringNode = y.Scalar<string> | string

export type YAMLNode = y.Document | y.Document.Parsed | y.Node | y.Pair

/* -------------------------------------------------------
  ---- NOODL NODES
-------------------------------------------------------- */

export type BuiltInEvalFn<S extends string = string> = y.YAMLMap<
  S,
  y.YAMLMap<'dataIn' | 'dataOut', any>
>

export type Component<Type extends string = string> = y.YAMLMap<'type', Type>

export type If = y.YAMLMap<'if', y.YAMLSeq<any>>
