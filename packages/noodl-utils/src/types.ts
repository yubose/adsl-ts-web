export type QueryObj<O extends Record<string, any> = any> =
  | O
  | ((...args: any[]) => O)

export interface ParsedDestinationObject {
  destination: string
  id: string
  isSamePage?: boolean
  duration: number
}
