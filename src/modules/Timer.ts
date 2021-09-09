export interface TimerObject {
  dataKey: string
  page: string
  ref: NodeJS.Timeout | null
  value: any
}

class Timer implements TimerObject {
  #increment: ((inst: Timer) => any) | undefined
  dataKey: string
  page: string
  value: any
  ref: NodeJS.Timeout | null = null
  onStart: ((inst: Timer) => void) | undefined
  onStop: ((inst: Timer) => void) | undefined
  onClear: ((inst: Timer) => void) | undefined

  constructor({
    dataKey = '',
    value,
    page = '',
    increment,
    onStart,
    onStop,
    onClear,
  }: Pick<Partial<TimerObject>, 'dataKey' | 'value'> &
    Pick<Partial<Timer>, 'onStart' | 'onStop' | 'onClear'> & {
      increment?(inst: Timer): void
      page: TimerObject['page']
    }) {
    if (!('page' in arguments[0])) {
      throw new Error('Page is not provided')
    }
    this.dataKey = dataKey
    this.page = page
    this.value = value
    this.#increment = increment
    this.onStart = onStart
    this.onStop = onStop
    this.onClear = onClear
  }

  start() {
    if (!this.increment) {
      throw new Error('An increment function is required')
    }
    this.ref = setInterval(() => {
      if (this.value === null) this.value = 0
      this.increment()
    }, 1000)
    this.onStart?.(this)
  }

  stop() {
    this.ref && clearInterval(this.ref)
    this.ref = null
    this.onStop?.(this)
  }

  increment() {
    this.#increment?.(this)
  }

  clear() {
    this.ref && clearInterval(this.ref)
    this.ref = null
    this.onClear?.(this)
  }
}

export default Timer
