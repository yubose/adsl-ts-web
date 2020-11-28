import _ from 'lodash'
import Logger from 'logsnap'
import { EmitActionObject, IActionOptions, NOODLEmitTrigger } from '../types'
import Action from './Action'

const log = Logger.create('EmitAction')

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
    log.func('setDataKeyValue')
    if (typeof property === 'string') {
      this.dataKey = {
        ...(_.isString(this.dataKey) ? undefined : this.dataKey),
        [property]: value,
      }

      if (!value) {
        log.red(
          `You are setting a value of ${value} onto the dataKey property "${property}". Is this intended?`,
          this.getSnapshot(),
        )
      } else {
        log.grey(
          `Data value of "${
            typeof value === 'object' ? JSON.stringify(value) : value
          }" was set on dataKey property: ${property}`,
          this.getSnapshot(),
        )
      }
    } else if (property && typeof property === 'object') {
      const properties = Object.keys(property)
      properties.forEach((prop) => {
        this.dataKey = {
          ...(typeof this.dataKey === 'object' ? this.dataKey : undefined),
          [prop]: value,
        }
      })
      if (!property) {
        log.red(
          `You are setting a value of ${property} onto the dataKey. Is this intended?`,
          this.getSnapshot(),
        )
      } else {
        log.grey(
          `Data value of "${JSON.stringify(property)}" was set on the dataKey`,
          this.getSnapshot(),
        )
      }
    }
    return this
  }

  getSnapshot() {
    return {
      ...super.getSnapshot(),
      dataKey: this.dataKey,
      actions: this.actions,
      iteratorVar: this.iteratorVar,
      trigger: this.trigger,
    }
  }
}

export default EmitAction
