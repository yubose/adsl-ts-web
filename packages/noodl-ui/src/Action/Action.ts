import Logger from 'logsnap'
import {
  IAction,
  ActionCallback,
  ActionOptions,
  ActionSnapshot,
  ActionStatus,
  ActionObject,
  BaseActionObject,
} from '../types/actionTypes'
import { getRandomKey } from '../utils/common'
import { AbortExecuteError } from '../errors'

const log = Logger.create('Action')

export const DEFAULT_TIMEOUT_DELAY = 8000

class Action<OriginalAction extends BaseActionObject = ActionObject>
  implements IAction<any> {
  #id: string
  #callback: ActionCallback | undefined
  #onPending: (snapshot: ActionSnapshot) => any
  #onResolved: (snapshot: ActionSnapshot) => any
  #onError: (snapshot: ActionSnapshot) => any
  #onAbort: (snapshot: ActionSnapshot) => any
  #onTimeout: any
  #trigger: string = ''
  #status: ActionStatus = null
  #timeout: NodeJS.Timeout | null = null
  #timeoutRemaining: number | null = null
  #timeoutInterval: any | null = null
  error: Error | null = null
  executed: boolean = false
  hasExecutor: boolean = false
  original: OriginalAction
  result: any
  resultReturned: boolean = false
  timeoutDelay: number = DEFAULT_TIMEOUT_DELAY
  type: OriginalAction['actionType']
  actionType: OriginalAction['actionType']

  constructor(action: OriginalAction, options?: ActionOptions<OriginalAction>) {
    log.func('constructor')
    if (!action || !('actionType' in action)) {
      log.red(
        `Missing "actionType" property. It is possible that the behavior of ` +
          `this action may not be what is expected`,
        { action, ...options },
      )
    }
    this.#id = this.#id || options?.id || getRandomKey()
    this.#callback = options?.callback
    this.original = action
    this.timeoutDelay = options?.timeoutDelay || DEFAULT_TIMEOUT_DELAY
    this.type = action.actionType // TODO - Deprecate this.type for this.actionType
    this.actionType =
      action.actionType || ('emit' in action || {} ? 'emit' : '')
    this.trigger = options?.trigger || ''
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
      this.executed = false
      this.#timeoutRemaining = this.timeoutDelay
      this.status = 'pending'

      this.#timeoutInterval = setInterval(() => {
        ;(this.#timeoutRemaining as number) -= 1000
      }, 1000)

      this.#timeout = setTimeout(() => {
        this.clearTimeout()
        this.status = 'timed-out'
      }, this.timeoutDelay || DEFAULT_TIMEOUT_DELAY)

      // TODO - Logic for return values as objects (new if/ condition in action chains)
      this.result = await this.callback?.(this, args)
      if (this.result !== undefined) this['resultReturned'] = true
      this.status = 'resolved'

      return this.result
    } catch (error) {
      this.error = error
      this.status = 'error'
      // TODO more thought on this
      throw error
    } finally {
      this.clearTimeout()
      this.clearInterval()
      this.executed = true
    }
  }

  get callback() {
    return this.#callback
  }

  set callback(callback: ActionCallback | undefined) {
    this.#callback = callback
    this['hasExecutor'] = typeof this.#callback === 'function'
  }

  get trigger() {
    return this.#trigger
  }

  set trigger(trigger: string) {
    this.#trigger = trigger || ''
  }

  get id() {
    return this.#id
  }

  // Returns an update-to-date JS representation of this instance
  // This is needed to log to the console the current state instead of logging
  // this instance directly where values will not be as expected
  getSnapshot(): ActionSnapshot<OriginalAction> {
    const snapshot = {
      actionType: this.type as string,
      hasExecutor: this.hasExecutor,
      id: this.id as string,
      original: this.original,
      status: this.status,
      timeout: {
        running: this.isTimeoutRunning(),
        remaining: this.#timeoutRemaining,
      },
    }
    if (this.status === 'resolved') snapshot['result'] = this.result
    else if (this.status === 'error') snapshot['result'] = this.error
    return snapshot
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
    if (Array.isArray(reason)) {
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

  toString() {
    return JSON.stringify(this.getSnapshot(), null, 2)
  }
}

export default Action
