import add from 'date-fns/add'

class Timer {
  #onIncrement: Timer['onIncrement']
  #onClear: Timer['onClear']
  dataKey: string
  pageName: string
  ref: NodeJS.Timeout | undefined
  isGlobal: boolean
  value: Date | undefined

  constructor({
    dataKey = '',
    initialValue,
    pageName = '',
  }: { dataKey?: string; initialValue?: Date; pageName?: string } = {}) {
    this.dataKey = dataKey
    this.pageName = pageName
    this.value = initialValue
  }

  increment() {
    this.value = add(new Date(this.value as Date), { seconds: 1 })
    console.log(
      `%cNew value after incremented: ${this.value}`,
      `color:#c4a901;`,
    )
    return this.value
  }

  start() {
    this.ref = setInterval(() => {
      this.#onIncrement?.(this.value)
    }, 1000)
  }

  clear() {
    // @ts-expect-error
    clearInterval(this.ref)
    this.#onClear?.()
  }

  on<Evt extends 'increment'>(evt: Evt, fn: Timer['onIncrement']) {
    if (evt === 'increment') this.onIncrement = fn
    return this
  }

  set onClear(fn: (() => void) | undefined) {
    this.#onClear = fn
  }

  set onIncrement(fn: ((value: Date | undefined) => void) | undefined) {
    this.#onIncrement = fn
  }
}

export default Timer
