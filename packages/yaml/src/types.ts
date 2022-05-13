import type { ARoot } from '@noodl/core'
import y from 'yaml'

export type DataObject = ARoot | YAMLNode | Map<any, any> | Set<any>
export type StringNode = y.Scalar<string> | string
export type YAMLNode = y.Node | y.Document | y.Document.Parsed | y.Pair
