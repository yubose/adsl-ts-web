import {
  EmitActionObject,
  IfObject,
  NOODLActionType,
  NOODLStyleBorderObject,
  NOODLComponentType,
  NOODLComponent,
  NOODLContentType,
  NOODLStyle,
  Path,
} from 'noodl-ui'

/* -------------------------------------------------------
  ---- LOOSELY TYPED COMPONENTS
-------------------------------------------------------- */

export type INOODLBaseComponent<T extends string> = {
  type: T
  [key: string]: any
}

export interface INOODLButton extends INOODLBaseComponent<'button'> {
  type: 'button'
}

export interface INOODLDivider extends INOODLBaseComponent<'divider'> {
  type: 'divider'
}

export interface INOODLFooter extends INOODLBaseComponent<'footer'> {
  type: 'footer'
}

export interface INOODLHeader extends INOODLBaseComponent<'header'> {
  type: 'header'
}

export interface INOODLImage extends INOODLBaseComponent<'image'> {
  type: 'image'
  path?: Path
}

export interface INOODLLabel extends INOODLBaseComponent<'label'> {
  type: 'label'
}

export interface INOODLList extends INOODLBaseComponent<'list'> {
  type: 'list'
  iteratorVar?: string
  listObject?: any[]
}

export interface INOODLListItem extends INOODLBaseComponent<'listItem'> {
  type: 'listItem'
}

export interface INOODLPlugin extends INOODLBaseComponent<'plugin'> {
  type: 'plugin'
}

export interface INOODLPopUp extends INOODLBaseComponent<'popUp'> {
  type: 'popUp'
  popUpView?: string
}

export interface INOODLSelect extends INOODLBaseComponent<'select'> {
  type: 'select'
}

export interface INOODLTextField extends INOODLBaseComponent<'textField'> {
  type: 'textField'
  placeholder?: string
}

export interface INOODLTextView extends INOODLBaseComponent<'textView'> {
  type: 'textView'
}

export interface INOODLVideo extends INOODLBaseComponent<'video'> {
  type: 'video'
  poster?: string
  videoFormat?: string
}

export interface INOODLView extends INOODLBaseComponent<'view'> {
  type: 'view'
}
