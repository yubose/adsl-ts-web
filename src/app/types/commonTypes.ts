export type Styles = Omit<Partial<CSSStyleDeclaration>, 'length' | 'parentRule'>

export type AuthStatus =
  | 'logged.in'
  | 'logged.out'
  | 'new.device'
  | 'temporary'
  | null

export interface SerializedError {
  name: string
  message: string
  code?: number
  source?: string
}
