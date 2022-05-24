import type { ARoot, DiagnosticsHelpers, VisitFnArgs } from '@noodl/core'
import type { ReferenceString } from 'noodl-types'
import y from 'yaml'
import * as c from './constants'

export type DataObject = ARoot | Map<any, any> | Set<any> | YAMLNode

export interface AssertFn<
  N = unknown,
  H extends Record<string, any> = Record<string, any>,
> {
  (args: AssertFnArgs<N, H>): ReturnType<y.visitorFn<N>>
}

export interface AssertAsyncFn<
  N = unknown,
  H extends Record<string, any> = Record<string, any>,
> {
  (args: AssertFnArgs<N, H>): ReturnType<y.asyncVisitorFn<N>>
}

export type AssertFnArgs<
  N = unknown,
  H extends Record<string, any> = Record<string, any>,
> = VisitFnArgs<H, N>

export interface RunDiagnosticsOptions<N = unknown>
  extends Omit<VisitFnArgs<DiagnosticsHelpers>, 'name' | 'value'> {
  node: N
}

export interface VisitorState {
  history: VisitorHistoryObject[]
  queue: VisitorQueueObject[]
}

export type VisitorHistoryStatus = 'error' | 'resolved'
export type VisitorQueueStatus = 'error' | 'pending' | 'visited'

export interface VisitorHistoryObject {
  status: c.VisitorHistoryStatus
  node: YAMLNode
}

export interface VisitorQueueObject {
  children?: VisitorState['queue']
  id: string
  kind: c.Kind | c.MapKind | c.ScalarKind | c.SeqKind
  node: YAMLNode
  status: c.VisitorQueueStatus
}

export interface VisitorStateHelpers {
  getState(slice: 'async' | 'sync'): VisitorState
  getState(): { async: VisitorState; sync: VisitorState }
  clearState(): void
  isAsync: boolean
}

export type YAMLDiagnosticObject = VisitFnArgs<{
  indent?: number
  offset?: number
  range?: [number, number, number]
  node: unknown
}>

export type YAMLNode = y.Document | y.Document.Parsed | y.Node | y.Pair

/* -------------------------------------------------------
  ---- NOODL NODES
-------------------------------------------------------- */

export type BuiltInEvalFn<S extends string = string> = y.YAMLMap<
  S,
  y.YAMLMap<'dataIn' | 'dataOut', any>
>

export type Component<Type extends string = string> = y.YAMLMap<'type', Type>

export type If = y.YAMLMap<'if', IfNode>

export type IfNode = y.YAMLSeq<[unknown, unknown, unknown]>

export type ReferenceNode = y.Scalar<ReferenceString>

export type NoodlNode<N = unknown> = N | y.Scalar<ReferenceString>
