import _ from 'lodash'
import { EmitActionObject, IActionOptions } from '../types'
import Action from './Action'

class EmitAction extends Action<EmitActionObject> {
  #dataObject: any
  // #iteratorVar: string | undefined
  dataKey: string | { [key: string]: any } | undefined
  actions: any[] | undefined
  iteratorVar: string | undefined
  trigger: 'onClick' | 'path' | undefined

  constructor(
    action: EmitActionObject,
    options?: IActionOptions<EmitActionObject> &
      Partial<{
        // iteratorVar: string
        trigger: 'onClick' | 'path'
      }>,
  ) {
    super(action, options)
    this['actions'] = action?.emit.actions
    this['dataKey'] = action?.emit.dataKey
    this['trigger'] = options?.trigger
  }

  set(key: 'dataObject' | 'iteratorVar' | 'trigger', value: any) {
    if (key === 'dataObject') return this.setDataObject(value)
    this[key] = value
    return this
  }

  getDataObject<T>(): T | undefined {
    return this.#dataObject
  }

  setDataObject(dataObject: any) {
    this.#dataObject = dataObject
    return this
  }
}

export default EmitAction
