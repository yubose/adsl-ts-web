import { EmitObject, Identify } from 'noodl-types'
import { Action, createAction as __createAction } from 'noodl-action-chain'
import getActionType from './getActionType'
import { isObj, isStr } from './internal'
import {
  NOODLUIAction,
  NOODLUIActionObject,
  NOODLUIActionObjectInput,
  NOODLUITrigger,
} from '../types'
import EmitAction from '../actions/EmitAction'

type EmitLikeObject = Extract<NOODLUIActionObjectInput, EmitObject>
type NonEmitLikeObject = Exclude<NOODLUIActionObjectInput, EmitObject>

function createAction(args: {
  action: NonEmitLikeObject
  trigger: NOODLUITrigger
}): Action
function createAction(args: {
  action: EmitLikeObject
  trigger: NOODLUITrigger
}): EmitAction
function createAction(trigger: NOODLUITrigger, obj: NonEmitLikeObject): Action
function createAction(trigger: NOODLUITrigger, obj: EmitLikeObject): EmitAction
function createAction(
  args:
    | NOODLUITrigger
    | { action: NOODLUIActionObjectInput; trigger: NOODLUITrigger },
  args2?: NOODLUIActionObjectInput | string,
) {
  let action: NOODLUIAction | undefined

  if (isStr(args)) {
    if (Identify.emit(args2)) {
      action = new EmitAction(args, args2)
    } else if (args2) {
      if (isStr(args2)) {
        action = __createAction(args, { actionType: 'goto', goto: args2 })
      } else if (isObj(args2)) {
        if (!('actionType' in args2)) {
          if (Identify.goto(args2)) args2.actionType = 'goto'
          else if (Identify.toast(args2)) args2['actionType'] = 'toast'
          else args2['actionType'] = 'anonymous'
        }
        action = __createAction(args, args2 as NOODLUIActionObject)
      }
    }
  } else {
    if (Identify.emit(args.action)) {
      action = new EmitAction(args.trigger, args.action)
    } else {
      if (!('actionType' in args.action)) {
        args.action = { ...args.action, actionType: getActionType(args.action) }
      }
      action = __createAction(args.trigger, args.action as NOODLUIActionObject)
    }
  }

  return action
}

export default createAction
