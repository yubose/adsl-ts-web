import { EmitObject } from 'noodl-types'
import { Action, IAction } from 'noodl-action-chain'
import { EmitActionObject, NOODLUITrigger } from '../types'

class EmitAction
  extends Action<'emit', NOODLUITrigger>
  implements IAction<'emit', NOODLUITrigger> {
  actions: any[]
  dataKey: string | Record<string, any> | undefined

  constructor(trigger: NOODLUITrigger, obj: EmitObject | EmitActionObject) {
    const actionObjArg =
      (typeof obj === 'object' && !('emit' in obj)
        ? ({ ...obj, actionType: 'emit' } as EmitActionObject)
        : (obj as EmitActionObject)) || undefined
    super(trigger, actionObjArg)
    this.actions = actionObjArg.emit?.actions || []
    this.dataKey = actionObjArg.emit?.dataKey
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
