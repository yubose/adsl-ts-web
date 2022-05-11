import fs from 'fs'
import { _symbol } from './constants'

export abstract class AIterator<INode = any, INext = any> {
  abstract getIterator(
    data: ARoot | Record<string, INode>,
  ): Iterator<INode, any, INext>
}

export abstract class AFileSystem {
  abstract readFile(
    ...args: Parameters<typeof fs['readFile']>
  ): ReturnType<typeof fs['readFile']>
  abstract readFileSync(
    ...args: Parameters<typeof fs['readFileSync']>
  ): ReturnType<typeof fs['readFileSync']>
  abstract writeFile(...args: Parameters<typeof fs['writeFile']>): Promise<any>
  abstract writeFileSync(...args: Parameters<typeof fs['writeFileSync']>): any
}

export abstract class ARoot<R = any> {
  abstract value: R
  abstract get(key: string): any
  abstract set(key: string, value: any): this
  abstract remove(key: string): this
  constructor() {
    Object.defineProperty(this, '_id_', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: _symbol.root,
    })
  }
}

export abstract class AVisitor<R = any, H = Record<string, any>> {
  callback?: (args: VisitFnArgs<H>) => any
  abstract visit(node: any, options?: Partial<VisitorOptions<H>>): R
  abstract visitAsync(
    node: any,
    options?: Partial<VisitorOptions<H>>,
  ): Promise<R>
  abstract use(callback: AVisitor<any, any>['callback']): this
}

export interface VisitorOptions<Options = Record<string, any>> {
  data: Record<string, any>
  init?: (args: { data: Record<string, any> } & Record<string, any>) => any
  helpers?: Options
}

export type VisitFnArgs<H extends Record<string, any> = Record<string, any>> = {
  pageName: string
  name?: string
  key: null | string | number
  value: any
  path?: any[]
  diagnostics: Record<string, any>
  root: ARoot
} & H

export type NormalizePropsContext = {
  dataObject?: Record<string, any>
  iteratorVar?: string
  index?: number
  listObject?: string | any[]
} & Record<string, any>

export type Path = (string | number)[]

export interface IViewport {
  width: number
  height: number
}
