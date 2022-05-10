import Builder from './Builder'

export abstract class AIterator<INode, INext = any> {
  abstract getIterator(
    data: ReturnType<AIterator<INode>['getItems']>,
  ): Iterator<INode, any, INext>
  abstract getItems(data: any): any[]
}

export abstract class ADiagnostics extends Builder {
  abstract run(
    data: any,
    options?: {
      async?: boolean
      init?: (args: { data: Record<string, any> }) => any
      beforeEnter?: (enterValue: any) => any
      enter?: AVisitor<DiagnosticObject[], DiagnosticsHelpers>['callback']
    },
  ): DiagnosticObject[]
}

export interface DiagnosticsHelpers {
  add(opts: { key: string; value: any; messages: any[] }): void
}

export interface DiagnosticObject {
  page: string
  key: string | number
  value: any
  messages: {
    type: 'error' | 'info' | 'warn'
    message: string
  }[]
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
