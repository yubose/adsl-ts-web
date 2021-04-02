import { EmitObject } from 'noodl-types'
import { Action, IAction } from 'noodl-action-chain'
import { EmitActionObject, NOODLUITrigger } from '../types'
import { isObj } from '../utils/internal'

class EmitAction
  extends Action<'emit', NOODLUITrigger>
  implements IAction<'emit', NOODLUITrigger> {
  actions: any[]
  dataKey: string | Record<string, any> | undefined

  constructor(trigger: NOODLUITrigger, obj: EmitObject | EmitActionObject) {
    if (isObj(obj) && obj.actionType !== 'emit') {
      obj = { ...obj, actionType: 'emit' }
    }
    super(trigger, obj as EmitActionObject)
    this.actions = obj.emit?.actions || []
    this.dataKey = obj.emit?.dataKey
  }

  get executor() {
    return super.executor
  }

  set executor(executor: Action['executor']) {
    super.executor = executor
  }

  snapshot() {
    return {
      ...super.snapshot(),
      dataKey: this.dataKey,
      actions: this.actions,
    }
  }
}

export default EmitAction
