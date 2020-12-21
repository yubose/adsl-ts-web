import isPlainObject from 'lodash/isPlainObject'
import { YAMLMap } from 'yaml/types'
import { NOODLMapIdentities } from './identifyMap'

export interface PushInvalidation {
  (reason: string, ...args: any[]): any
}

export interface Evaluate {
  (
    node: YAMLMap | { [key: string]: any },
    push: PushInvalidation,
    options?: any,
  )
}

export type EvaluateMap = Record<NOODLMapIdentities, Evaluate>

const evaluateMaps = {} as EvaluateMap

evaluateMaps.actionObject = function (action, push: PushInvalidation) {
  if (isPlainObject(action)) {
    //
  } else if (action instanceof YAMLMap) {
    //
  }
}

export default evaluateMaps
