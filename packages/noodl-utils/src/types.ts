export type DateLike<T extends { 'text=func': any } = { 'text=func': any }> = T

export type PlainObject = { [key: string]: any }

export interface PlainObjectFunc<DataObject = PlainObject> {
  (): DataObject
}

export interface DataObject {
  [key: string]: any
}

export interface DataFunc<O extends DataObject = any> {
  (): O
}

export type QueryObj<O extends DataObject = any> = O | DataFunc<O>

export type TextLike<T extends { text: any } = { text: any }> = T
