import { EmitObject } from 'noodl-types'
import { Action, IAction } from 'noodl-action-chain'
import { EmitActionObject, NUITrigger } from '../types'
import { isObj } from '../utils/internal'

class EmitAction
  extends Action<'emit', NUITrigger>
  implements IAction<'emit', NUITrigger> {
  actions: any[]
  dataKey: string | Record<string, any> | undefined

  constructor(trigger: NUITrigger, obj: EmitObject | EmitActionObject) {
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
