import { isObj, isStr } from './_internal'

export function createIsIteratorVarConsumer(iteratorVar: string) {
  return (val: any) => isObj(val) && isStr(iteratorVar) && iteratorVar in val
}
