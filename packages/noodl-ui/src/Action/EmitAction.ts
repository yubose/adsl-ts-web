import isPlainObject from 'lodash/isPlainObject'
import { EmitActionObject, IActionOptions, NOODLEmitTrigger } from '../types'
import Action from './Action'

class EmitAction extends Action<EmitActionObject> {
  actions: any[] | undefined
  dataKey: string | { [key: string]: any } | undefined
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
    this.#trigger = options?.trigger
  }

  get trigger() {
    return this.#trigger
  }

  set(
    values: {
      dataKey?: string
      iteratorVar?: string
      trigger?: NOODLEmitTrigger
    },
    value?: any,
  ): this
  set(key: 'dataKey' | 'iteratorVar' | 'trigger', value: any): this
  set(
    key:
      | ('dataKey' | 'iteratorVar' | 'trigger')
      | { dataKey?: string; iteratorVar?: string; trigger?: NOODLEmitTrigger },
    value: any,
  ) {
    if (arguments.length === 1 && typeof key === 'object') {
      if (key === null) return void this.setDataKey(null)
      Object.keys(key).forEach((k) => {
        if (k === 'dataKey') this.setDataKey(key)
        else this[k] = key[k]
      })
    } else if (arguments.length == 2) {
      if (key === 'dataKey') this.setDataKey(key as 'dataKey', value)
      else if (key === 'trigger') this.#trigger = value
      else this[key as string] = value
    }
    return this
  }

  setDataKey(key: string, value: any): this
  setDataKey(key: { [key: string]: any }, value?: any): this
  setDataKey(key: string | { [key: string]: any }, value?: any) {
    if (arguments.length === 1) {
      if (key === null) return void (this.dataKey = null)
      if (isPlainObject(key)) {
        if (!this.dataKey) this.dataKey = {}
        value = { ...(this.dataKey as object), ...(key as object) }
      } else {
        value = key as string
      }
    } else if (arguments.length > 1) {
      if (!this.dataKey) this.dataKey = {}
      value = { ...(this.dataKey as object), [key as string]: value }
    }
    if (value != null) this.dataKey = value
    return this
  }

  clearDataKey(key?: string) {
    if (!arguments.length) {
      this.dataKey = undefined
    } else if (key) {
      if (typeof this.dataKey === 'object') {
        delete this.dataKey[key]
      }
    }
    return this
  }
}

export default EmitAction
