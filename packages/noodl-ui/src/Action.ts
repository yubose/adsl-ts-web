import _ from 'lodash'
import {
  ActionSnapshot,
  ActionStatus,
  NOODLChainActionBuiltInObject,
  NOODLChainActionObject,
} from './types'
import { getRandomKey } from './utils/common'
import { AbortExecuteError } from './errors'
import Logger from 'logsnap'

const log = Logger.create('Action')

export interface ActionCallback {
  (snapshot: ActionSnapshot, handlerOptions?: any): any
}

export interface ActionOptions<
  OriginalAction extends NOODLChainActionObject = any
> {
  callback?: ActionCallback
  id?: string
  onPending?: (snapshot: ActionSnapshot<OriginalAction>) => any
  onResolved?: (snapshot: ActionSnapshot<OriginalAction>) => any
  onTimeout?: (snapshot: ActionSnapshot<OriginalAction>) => any
  onError?: (snapshot: ActionSnapshot<OriginalAction>) => any
  onAbort?: (snapshot: ActionSnapshot<OriginalAction>) => any
  timeoutDelay?: number
}

export const DEFAULT_TIMEOUT_DELAY = 10000

class Action<OriginalAction extends NOODLChainActionObject> {
  #id: string | undefined = undefined
  #callback: ActionCallback | undefined
  #onPending: (snapshot: ActionSnapshot) => any
  #onResolved: (snapshot: ActionSnapshot) => any
  #onError: (snapshot: ActionSnapshot) => any
  #onAbort: (snapshot: ActionSnapshot) => any
  #onTimeout: any
  #status: ActionStatus = null
  #timeout: NodeJS.Timeout | null = null
  #timeoutRemaining: number | null = null
  #timeoutInterval: any | null = null
  error: Error | null = null
  original: OriginalAction
  result: any
  timeoutDelay: number = DEFAULT_TIMEOUT_DELAY
  type: string | undefined = undefined

  constructor(action: OriginalAction, options?: ActionOptions<OriginalAction>) {
    log.func('constructor')
    if (!action || !('actionType' in action)) {
      log.red(
        `Missing "actionType" property. It is possible that the behavior of ` +
          `this action may not be what is expected`,
        action,
      )
    }
    this.#id = this.#id || options?.id || getRandomKey()
    this.#callback = options?.callback
    this.original = action
    this.timeoutDelay = options?.timeoutDelay || DEFAULT_TIMEOUT_DELAY
    this.type = action.actionType
  }

  /**
   * Executes the callback that is registered to this action, optionally
   * passing in any additional arguments
   * @param { any } args - Arguments passed to the executor function
   */
  async execute<Args = any>(args?: Args): Promise<any> {
    log.func('execute')
    try {
      if (this.#timeout) this.clearTimeout()
      if (this.#timeoutInterval) this.clearInterval()

      this.result = undefined
      this.error = null
      this.#timeoutRemaining = this.timeoutDelay
      this.status = 'pending'

      this.#timeoutInterval = setInterval(() => {
        ;(this.#timeoutRemaining as number) -= 1000
      }, 1000)

      this.#timeout = setTimeout(() => {
        this.clearTimeout()
        this.status = 'timed-out'
      }, this.timeoutDelay || DEFAULT_TIMEOUT_DELAY)

      log.func(`execute --> ${this.type}`)
      log.hotpink(
        `${
          this.type === 'builtIn'
            ? `funcName: ${
                (this.original as NOODLChainActionBuiltInObject).funcName
              }`
            : ''
        }Executing`,
        { snapshot: this.getSnapshot(), args },
      )

      this.result = await this.callback?.(this.getSnapshot(), args)
      this.status = 'resolved'

      return this.result
    } catch (error) {
      this.error = error
      this.status = 'error'
      // TODO more thought on this
      if (error instanceof AbortExecuteError) {
        log.red('Caught an AbortExecuteError error', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        })
        throw error
      } else {
        throw error
      }
    } finally {
      this.clearTimeout()
      this.clearInterval()

      const logArgs = {
        snapshot: this.getSnapshot(),
        args,
      }

      if (this.result) logArgs['result'] = this.result

      log
        .func(
          `${this.type}${
            this.type === 'builtIn'
              ? ` ---> ${
                  (this.original as NOODLChainActionBuiltInObject).funcName
                }`
              : ''
          }`,
        )
        .hotpink('Executed', logArgs)
    }
  }

  get callback() {
    return this.#callback
  }

  set callback(callback: ActionCallback | undefined) {
    this.#callback = callback
  }

  get id() {
    return this.#id
  }

  // Returns an update-to-date JS representation of this instance
  // This is needed to log to the console the current state instead of logging
  // this instance directly where values will not be as expected
  getSnapshot(): ActionSnapshot<OriginalAction> {
    return {
      actionType: this.type as string,
      hasExecutor: _.isFunction(this.#callback),
      id: this.id as string,
      original: this.original,
      status: this.status,
      timeout: {
        running: this.isTimeoutRunning(),
        remaining: this.#timeoutRemaining,
      },
    }
  }

  get status() {
    return this.#status
  }

  set status(status: ActionStatus) {
    this.#status = status
    if (status === 'pending') this.onPending?.(this.getSnapshot())
    if (status === 'resolved') this.onResolved?.(this.getSnapshot())
    if (status === 'error') this.onError?.(this.getSnapshot())
    if (status === 'timed-out') this.onTimeout?.(this.getSnapshot())
    if (status === 'aborted') this.onAbort?.(this.getSnapshot())
  }

  get onPending() {
    return this.#onPending
  }

  set onPending(onPending: (snapshot: ActionSnapshot<OriginalAction>) => any) {
    this.#onPending = onPending
  }

  set onResolved(
    onResolved: (snapshot: ActionSnapshot<OriginalAction>) => any,
  ) {
    this.#onResolved = onResolved
  }

  get onResolved() {
    return this.#onResolved
  }

  set onError(onError: (snapshot: ActionSnapshot<OriginalAction>) => any) {
    this.#onError = onError
  }

  get onError() {
    return this.#onError
  }

  set onAbort(onAbort: (snapshot: ActionSnapshot<OriginalAction>) => any) {
    this.#onAbort = onAbort
  }

  get onAbort() {
    return this.#onAbort
  }

  abort(reason: string | string[], callback?: Function) {
    if (_.isArray(reason)) {
      reason = reason.join(', ')
    }
    if (this.isTimeoutRunning()) {
      this.clearTimeout()
    }
    this.status = 'aborted'
    const err = new AbortExecuteError(reason)
    callback?.(err)
    throw err
  }

  set onTimeout(onTimeout: (snapshot: ActionSnapshot<OriginalAction>) => any) {
    this.#onTimeout = onTimeout
  }

  get onTimeout() {
    return this.#onTimeout
  }

  clearTimeout() {
    if (this.#timeout) {
      clearTimeout(this.#timeout)
    }
    this.#timeout = null
    this.#timeoutRemaining = null
  }

  clearInterval() {
    if (this.#timeoutInterval) {
      clearInterval(this.#timeoutInterval)
    }
    this.#timeoutInterval = null
    this.#timeoutRemaining = null
  }

  isTimeoutRunning() {
    return this.#timeout !== null
  }
}

export default Action
