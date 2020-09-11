export type Styles = Omit<Partial<CSSStyleDeclaration>, 'length' | 'parentRule'>

export interface SerializedError {
  name: string
  message: string
  code?: number
  source?: string
}
