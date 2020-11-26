import {
  ActionChainActionCallback,
  EmitActionObject,
  IfObject,
  NOODLActionType,
  StyleBorderObject,
  NOODLComponentType,
  NOODLComponent,
  NOODLContentType,
  NOODLPageObject,
  Style,
  Path,
  IViewport,
} from 'noodl-ui'

export interface INOODLPageObject {
  // name: string // private
  components?: NOODLComponent[]
  init?: string | string[]
  module?: string
  pageNumber?: number
  [key: string]: any
}

/* -------------------------------------------------------
  ---- HIGH LEVEL INTERFACES
-------------------------------------------------------- */

export interface INOODLBuilder {
  assetsUrl: string
  actions: {
    [actionType: string]: {
      context?: any
      fn?: Function
      trigger?: ActionTriggerType
    }[]
  }
  builtIns: {
    [funcName: string]: Function
  }
  build(): any
  reset(): this
  setAssetsUrl(assetsUrl: string): this
  setPage(name: string): this
  setRoot(key: string, value: any): this
  setViewport(viewport: IViewport): this
  viewport: IViewport | null
}

/* -------------------------------------------------------
  ---- LOOSELY TYPED COMPONENTS
-------------------------------------------------------- */

export type INOODLBaseComponent<T extends string> = {
  type: T
  [key: string]: any
}

export interface INOODLButton extends INOODLBaseComponent<'button'> {}

export interface INOODLDivider extends INOODLBaseComponent<'divider'> {}

export interface INOODLFooter extends INOODLBaseComponent<'footer'> {}

export interface INOODLHeader extends INOODLBaseComponent<'header'> {}

export interface INOODLImage extends INOODLBaseComponent<'image'> {
  path?: Path
}

export interface INOODLLabel extends INOODLBaseComponent<'label'> {}

export interface INOODLList extends INOODLBaseComponent<'list'> {
  iteratorVar?: string
  listObject?: any[]
}

export interface INOODLListItem extends INOODLBaseComponent<'listItem'> {}

export interface INOODLPlugin extends INOODLBaseComponent<'plugin'> {}

export interface INOODLPopUp extends INOODLBaseComponent<'popUp'> {
  popUpView?: string
}

export interface INOODLSelect extends INOODLBaseComponent<'select'> {}

export interface INOODLTextField extends INOODLBaseComponent<'textField'> {
  placeholder?: string
}

export interface INOODLTextView extends INOODLBaseComponent<'textView'> {}

export interface INOODLVideo extends INOODLBaseComponent<'video'> {
  poster?: string
  videoFormat?: string
}

export interface INOODLView extends INOODLBaseComponent<'view'> {}

/* -------------------------------------------------------
  ---- ACTION OBJECTS
-------------------------------------------------------- */

export interface IBaseAction<T extends string> {
  actionType: T
  [key: string]: any
}

export interface IBuiltInAction extends IBaseAction<'builtIn'> {
  funcName: string
}

export interface IEmitAction extends IBaseAction<'emit'> {
  emit: {
    actions: [any, any, any]
    dataKey: string | { [key: string]: string }
  }
}

export interface IEvalAction extends IBaseAction<'evalObject'> {
  object?: Function | IfObject
}

export interface IGotoAction extends IBaseAction<'goto'> {
  destination?: string
}

export interface IPageJumpAction extends IBaseAction<'pageJump'> {
  destination: string
}

export interface IPopupAction extends IBaseAction<'popUp'> {
  popUpView: string
}

export interface IPopupDismissAction extends IBaseAction<'popUpDismiss'> {
  popUpView: string
}

export interface IRefreshAction extends IBaseAction<'refresh'> {
  //
}

export interface ISaveAction extends IBaseAction<'saveObject'> {
  object: [string, (...args: any[]) => any] | ((...args: any[]) => any)
}

export interface IUpdateAction<T = any> extends IBaseAction<'updateObject'> {
  object: T
}

/* -------------------------------------------------------
  ---- OTHER
-------------------------------------------------------- */

export type ActionTriggerType = 'onClick' | ' path'
