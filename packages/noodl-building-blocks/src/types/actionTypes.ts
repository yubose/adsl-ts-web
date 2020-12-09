import {
  BuiltInActionObject,
  EmitObject,
  EvalActionObject,
  PageJumpActionObject,
  PopupActionObject,
  PopupDismissActionObject,
  RefreshActionObject,
  SaveActionObject,
  UpdateActionObject,
} from 'noodl-types'

export type IAction =
  | IBuiltInAction
  | IEmitAction
  | IEmitAction
  | IGotoAction
  | IPageJumpAction
  | IPopUpAction
  | IPopupDismissAction
  | IRefreshAction
  | ISaveAction
  | IUpdateAction

export interface IBuiltInAction extends BuiltInActionObject {}

export interface IEmitAction extends EmitObject {
  actionType: 'emit'
}

export interface IEvalObjectAction extends EvalActionObject {}

export interface IGotoAction {
  actionType: 'goto'
  destination?: string
}

export interface IPageJumpAction extends PageJumpActionObject {}

export interface IPopUpAction extends PopupActionObject {}

export interface IPopupDismissAction extends PopupDismissActionObject {}

export interface IRefreshAction extends RefreshActionObject {}

export interface ISaveAction extends SaveActionObject {}

export interface IUpdateAction extends UpdateActionObject {}
