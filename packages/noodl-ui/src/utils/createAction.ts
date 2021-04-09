import { EmitObject, Identify } from 'noodl-types'
import { Action, createAction as __createAction } from 'noodl-action-chain'
import getActionType from './getActionType'
import getActionObjectErrors from './getActionObjectErrors'
import { isObj, isStr } from './internal'
import {
  NUIAction,
  NUIActionObject,
  NUIActionObjectInput,
  NUITrigger,
} from '../types'
import EmitAction from '../actions/EmitAction'

type EmitLikeObject = Extract<NUIActionObjectInput, EmitObject>
type NonEmitLikeObject = Exclude<NUIActionObjectInput, EmitObject>

function createAction(args: {
  action: NonEmitLikeObject
  trigger: NUITrigger | ''
}): Action
function createAction(args: {
  action: EmitLikeObject
  trigger: NUITrigger | ''
}): EmitAction
function createAction(trigger: NUITrigger | '', obj: NonEmitLikeObject): Action
function createAction(trigger: NUITrigger | '', obj: EmitLikeObject): EmitAction
function createAction(
  args:
    | NUITrigger
    | ''
    | { action: NUIActionObjectInput; trigger: NUITrigger | '' },
  args2?: NUIActionObjectInput | string,
) {
  let action: NUIAction | undefined

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
        action = __createAction(args, args2 as NUIActionObject)
      }
    }
  } else if ('action' in args) {
    if (Identify.emit(args.action)) {
      action = new EmitAction(args.trigger, args.action)
    } else {
      if (!('actionType' in args.action)) {
        args.action = { ...args.action, actionType: getActionType(args.action) }
      }
      action = __createAction(args.trigger, args.action as NUIActionObject)
    }
  }

  if (action?.original) {
    getActionObjectErrors(action.original).forEach((errMsg) => {
      console.log(`%c${errMsg}`, `color:#ec0000;`, action?.original)
    })
  }

  return action
}

export default createAction
