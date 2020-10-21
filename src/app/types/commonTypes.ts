export type Styles = Omit<Partial<CSSStyleDeclaration>, 'length' | 'parentRule'>

export type AuthStatus =
  | 'logged.in'
  | 'logged.out'
  | 'new.device'
  | 'temporary'
  | null
