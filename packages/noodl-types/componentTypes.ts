import { StyleObject } from './styleTypes'

export type ComponentType =
  | 'button'
  | 'divider'
  | 'footer'
  | 'header'
  | 'image'
  | 'label'
  | 'list'
  | 'listItem'
  | 'plugin'
  | 'pluginHead'
  | 'popUp'
  | 'select'
  | 'scrollView'
  | 'textField'
  | 'textView'
  | 'video'
  | 'view'

export interface ComponentObject<T extends string = any> {
  type: T
  style: StyleObject
  children?: any[]
  [key: string]: any
}

export interface ButtonComponentObject extends ComponentObject {
  type: 'button'
}

export interface DividerComponentObject extends ComponentObject {
  type: 'divider'
}

export interface FooterComponentObject extends ComponentObject {
  type: 'footer'
}

export interface HeaderComponentObject extends ComponentObject {
  type: 'header'
}

export interface ImageComponentObject extends ComponentObject {
  type: 'image'
  path: string
}

export interface LabelComponentObject extends ComponentObject {
  type: 'label'
}

export interface ListComponentObject extends ComponentObject {
  type: 'list'
  iteratorVar: String
  listObject: any[]
}

export interface ListItemComponentObject extends ComponentObject {
  type: 'listItem'
}

export interface PluginComponentObject extends ComponentObject {
  type: 'plugin'
}

export interface PluginHeadComponentObject extends ComponentObject {
  type: 'pluginHead'
}

export interface PopUpComponentObject extends ComponentObject {
  type: 'popUp'
}

export interface SelectComponentObject extends ComponentObject {
  type: 'select'
}

export interface ScrollViewComponentObject extends ComponentObject {
  type: 'scrollView'
}

export interface TextFieldComponentObject extends ComponentObject {
  type: 'textField'
}

export interface TextViewComponentObject extends ComponentObject {
  type: 'textView'
}

export interface VideoComponentObject extends ComponentObject {
  type: 'video'
}

export interface ViewComponentObject extends ComponentObject {
  type: 'view'
}
