export { default } from './authSlice'
export * from './authSlice'

export type AuthStatus =
  | 'logged.in'
  | 'logged.out'
  | 'new.device'
  | 'temporary'
  | null
