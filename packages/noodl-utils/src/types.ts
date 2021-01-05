export type PlainObject = { [key: string]: any }

export interface DataObject {
  [key: string]: any
}

export interface DataFunc<O extends DataObject = any> {
  (): O
}

export type QueryObj<O extends DataObject = any> = O | DataFunc<O>
