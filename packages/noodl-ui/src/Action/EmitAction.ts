import isPlainObject from 'lodash/isPlainObject'
import Logger from 'logsnap'
import {
  EmitActionObject,
  ActionOptions,
  EmitTrigger,
  EmitObject,
} from '../types'
import Action from './Action'

const log = Logger.create('EmitAction')

class EmitAction extends Action<EmitObject> {
  dataKey: string | { [key: string]: any } | undefined
  actions: any[] | undefined
  iteratorVar: string | undefined

  constructor(
    action: EmitObject,
    options?: ActionOptions<EmitActionObject> &
      Partial<{
        dataKey?: any
        iteratorVar: string
        trigger: EmitTrigger
      }>,
  ) {
    super({ ...action, actionType: 'emit' }, options)
    this.actions = action?.emit?.actions
    this.setDataKey(options?.dataKey || action?.emit?.dataKey)
    if (options?.iteratorVar) this.set('iteratorVar', options.iteratorVar)
    if (options?.callback) this.callback = options.callback
  }

  set(key: 'dataKey' | 'iteratorVar' | 'trigger', value: any) {
    this[key] = value
    return this
  }

  setDataKey(value: any) {
    this.dataKey = value
    return this
  }

  mergeDataKey(property: string, value: any): this
  mergeDataKey(property: { [key: string]: any }, args?: never): this
  mergeDataKey(property: string | { [key: string]: any }, value?: any) {
    if (arguments.length === 1) {
      if (typeof property !== 'object') {
        log.func('mergeDataKey ')
        log.red(
          `Cannot merge dataKey with just a string. Did you mean to use setDataKey instead?`,
        )
      } else {
        Object.assign(this.dataKey, property)
      }
    } else if (arguments.length === 2) {
      if (typeof property === 'string') {
        if (!isPlainObject(this.dataKey)) this.dataKey = {}
        Object.assign(this.dataKey, value)
      } else if (isPlainObject(property)) {
        Object.assign(this.dataKey, property)
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
