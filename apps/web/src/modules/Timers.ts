import isPlainObject from 'lodash/isPlainObject'
import Timer, { TimerObject } from './Timer'

class Timers {
  store = new Map<string, Timer>()

  get(page: string) {
    return this.store.get(page)
  }

  has(page: string) {
    return this.store.has(page) && this.store.get(page) instanceof Timer
  }

  set(page: string, obj: Partial<Omit<TimerObject, 'page'>>) {
    if (!this.has(page)) this.store.set(page, this.create({ page, ...obj }))
    const timer = this.store.get(page) as Timer
    if (isPlainObject(obj)) {
      Object.entries(obj).forEach(([key, value]) => {
        timer[key as keyof Timer] = value
      })
    }
    return timer
  }

  create<
    InitialValues extends Partial<Pick<TimerObject, 'dataKey' | 'value'>> & {
      page: TimerObject['page']
    } & Pick<Partial<Timer>, 'increment' | 'onClear' | 'onStart' | 'onStop'>
  >(timerObj: InitialValues) {
    this.store.set(timerObj.page as string, new Timer(timerObj))
    return this.store.get(timerObj.page as string) as Timer
  }
}

export default Timers
