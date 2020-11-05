import {
  ActionChainActionCallback,
  ActionChainActionCallbackReturnType,
  NOODLBuiltInObject,
} from './types'

class BuiltIn<FuncName extends string> {
  #func: ActionChainActionCallback | undefined
  #funcName: FuncName

  constructor(
    func: ActionChainActionCallback<NOODLBuiltInObject>,
    { funcName }: { funcName: FuncName },
  ) {
    this.#func = func
    this.#funcName = funcName
  }

  get func() {
    return this.#func
  }

  get funcName() {
    return this.#funcName
  }

  execute(...args: Parameters<ActionChainActionCallback<NOODLBuiltInObject>>) {
    return this.#func?.(...args) as ActionChainActionCallbackReturnType
  }
}

export default BuiltIn
