import _ from 'lodash'

const _color = {
  blue: '#0047ff',
  cyan: '#00D8C2',
  gold: '#c4a901',
  green: '#00b406',
  grey: '#95a5a6',
  hotpink: '#e50087',
  info: '#3498db',
  magenta: '#4E25D2',
  orange: '#FF5722',
  red: '#ec0000',
  salmon: 'salmon',
  teal: '#20B2AA',
  yellow: '#CCCD17',
} as const

type ColorMap = Record<keyof typeof _color, typeof _color[keyof typeof _color]>
type ColorLogFuncsRecord = Record<keyof ColorMap, ColorMap[keyof ColorMap]>
interface ColorLogFuncs {
  [color: string]: ColorMap[keyof ColorMap]
}

const logger = (function () {
  const cache = {}
  const cons = window.console

  class Logger implements ColorLogFuncsRecord {
    #cache: {
      [section: string]: {
        func?: string
        msg?: string
        data?: any
      }
    } = {}
    #id: string = ''
    #func: string = ''
    #cons: Console
    #color: string = ''
    log: Console['log']

    constructor(id: string) {
      this.id = id
      this.#cons = cons
      // this.log = cons.log.bind(cons, `[${id}]`)
      this.log = cons.log.bind(cons, ...this.stringifyArgs())
      this.initialize()
    }

    get id() {
      return this.#id
    }

    set id(id: string) {
      this.#id = id
    }

    func(name: string) {
      this.#func = name
      this.initialize()
      return this
    }

    initialize() {
      _.forEach(_color, (color) => {
        this[color] = cons.log.bind(cons, ...this.stringifyArgs({ color }))
      })
    }

    stringifyArgs({ color, data }: { color?: string; data?: any } = {}) {
      let str = `[${this.id}]`
      if (this.#func) str += `[${this.#func}]`
      str += ' %s'
      let args = [`%c${str}`, `color:${color || _color.grey};font-weight:bold;`]
      if (data) args.push(data)
      return args
    }
  }

  return {
    create(id: string) {
      let cached = cache[id as keyof typeof cache]
      let logger: Logger
      let log: Console['log']

      if (!cached) {
        logger = new Logger(id)
        cache[id] = logger
        return logger
      } else {
        return cached
      }
    },
  }
})()

export default logger
