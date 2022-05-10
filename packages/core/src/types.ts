import fs from 'fs'

export abstract class AIterator<INode, INext = any> {
  abstract getIterator(
    data: ReturnType<AIterator<INode>['getItems']>,
  ): Iterator<INode, any, INext>
  abstract getItems(data: any): any[]
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
}

export abstract class AVisitor<R = any, H = Record<string, any>> {
  callback?: (
    args: {
      name?: string
      key: null | string | number
      value: any
      path?: any[]
      diagnostics: Record<string, any>
    } & H,
  ) => any
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
