import {
  ActionChainActionCallback,
  NOODLChainActionEvalObject,
  NOODLChainActionGotoObject,
  NOODLChainActionGotoURL,
  NOODLChainActionPageJumpObject,
  NOODLChainActionPopupBaseObject,
  NOODLChainActionPopupDismissObject,
  NOODLChainActionRefreshObject,
  NOODLChainActionSaveObjectObject,
  NOODLChainActionUpdateObject,
} from 'noodl-ui'

export const onEvalObject: ActionChainActionCallback<NOODLChainActionEvalObject> = async (
  actions,
  options,
) => {
  //
}

export const onGoto: ActionChainActionCallback<
  NOODLChainActionGotoObject | NOODLChainActionGotoURL
> = (actions, options) => {
  //
}

export const onPageJump: ActionChainActionCallback<NOODLChainActionPageJumpObject> = (
  action,
  options,
) => {
  //
}

export const onPopUp: ActionChainActionCallback<NOODLChainActionPopupBaseObject> = (
  action,
  options,
) => {
  //
}

export const onPopUpDismiss: ActionChainActionCallback<NOODLChainActionPopupDismissObject> = (
  action,
  options,
) => {
  //
}

export const onRefresh: ActionChainActionCallback<NOODLChainActionRefreshObject> = (
  action,
  options,
) => {
  //
}

export const onSaveObject: ActionChainActionCallback<NOODLChainActionSaveObjectObject> = (
  action,
  options,
) => {
  //
}

export const onUpdateObject: ActionChainActionCallback<NOODLChainActionUpdateObject> = (
  action,
  options,
) => {
  //
}
