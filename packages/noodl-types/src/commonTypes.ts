import { ComponentObject } from './componentTypes'

export type ContentType =
  | 'countryCode'
  | 'email'
  | 'formattedDate'
  | 'formattedDuration'
  | 'listObject'
  | 'number'
  | 'password'
  | 'passwordHidden'
  | 'phoneNumber'
  | 'phone'
  | 'tel'
  | 'text'
  | 'videoSubStream'
  | 'vidoeSubStream'

export type EventType =
  | 'onClick'
  | 'onChange'
  | 'onHover'
  | 'onMouseEnter'
  | 'onMouseLeave'
  | 'onMouseOut'
  | 'onMouseOver'

export interface EmitObject {
  emit: {
    actions: any[]
    dataKey: string | { [key: string]: string }
  }
}

export interface GotoObject {
  goto: string
}

export interface IfObject {
  if: [any, any, any]
}

export interface PageObject {
  components: ComponentObject[]
  final?: string // ex: "..save"
  init?: string | string[] // ex: ["..formData.edge.get", "..formData.w9.get"]
  module?: string
  pageNumber?: string
  viewport?: any
  [key: string]: any
}
