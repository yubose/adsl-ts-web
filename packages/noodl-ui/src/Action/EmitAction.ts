import _ from 'lodash'
import { EmitActionObject, IActionOptions, NOODLEmitTrigger } from '../types'
import Action from './Action'

class EmitAction extends Action<EmitActionObject> {
  #dataObject: any
  // #iteratorVar: string | undefined
  dataKey: string | { [key: string]: any } | undefined
  actions: any[] | undefined
  iteratorVar: string | undefined
  #trigger: NOODLEmitTrigger | undefined

  constructor(
    action: EmitActionObject,
    options?: IActionOptions<EmitActionObject> &
      Partial<{
        // iteratorVar: string
        trigger: NOODLEmitTrigger
      }>,
  ) {
    super(action, options)
    // console.info(action)
    // console.info(options)
    this['actions'] = action?.emit?.actions
    this['dataKey'] = action?.emit?.dataKey
    this['trigger'] = options?.trigger
  }

  get trigger() {
    return this.#trigger
  }

  set trigger(trigger: NOODLEmitTrigger | undefined) {
    this.#trigger = trigger
  }

  set(key: 'dataKey' | 'dataObject' | 'iteratorVar' | 'trigger', value: any) {
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

  setDataKeyValue(property: string | { [key: string]: any }, value: any) {
    if (typeof property === 'string') {
      this.dataKey = {
        ...(_.isString(this.dataKey) ? undefined : this.dataKey),
        [property]: value,
      }
    } else if (property && typeof property === 'object') {
      const properties = Object.keys(property)
      properties.forEach((prop) => {
        this.dataKey = {
          ...(typeof this.dataKey === 'object' ? this.dataKey : undefined),
          [prop]: value,
        }
      })
    }
    return this
  }
}

export default EmitAction
