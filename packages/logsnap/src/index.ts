// This custom logger keeps the original stack track + line number

/**
 * Runs forEach on each key/value pair of the value, passing in the key as the first
 * argument and the value as the second argument on each iteration
 * @param { object } value
 * @param { function } callback - Callback function to run on each key/value entry
 */
function forEachEntries<Obj>(
  value: Obj,
  callback: <K extends keyof Obj>(key: K, value: Obj[K]) => void,
) {
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([k, v]) => callback(k as keyof Obj, v))
  }
}

export interface ILogger extends ColorFuncs {
  log: Console['log']
  id: string
  func(name?: string): this
}

export const _color = {
  blue: '#0047ff',
  cyan: '#00D8C2',
  gold: '#c4a901',
  green: '#00b406',
  grey: '#828282',
  hotpink: '#e50087',
  info: '#3498db',
  magenta: 'magenta',
  orange: '#FF5722',
  red: '#ec0000',
  salmon: 'salmon',
  teal: '#20B2AA',
  yellow: '#CCCD17',
} as const

type ColorKey = keyof typeof _color
type ColorFuncs = Record<ColorKey, Console['log']>

const logger = (function () {
  const state = {
    disabled: false,
    cache: {} as { [loggerId: string]: ILogger },
    cacheBackup: {} as { [loggerId: string]: ILogger },
  }
  let _bold = 'font-weight:bold;'
  let _noop = () => () => {}
  let cons = (state.disabled ? _noop : window.console) as typeof window.console

  function get(id: string) {
    const _innerState = { id, func: '' }

    const o: ILogger = {
      func: _func,
      get id() {
        return _innerState.id
      },
      set id(id: string) {
        _innerState['id'] = id
      },
      log: cons.log.bind(cons, `[${id}] %s`),
    } as ILogger

    const _stringifyArgs = ({
      color,
      data,
    }: { color?: string; data?: any } = {}) => {
      let msg = `[${_innerState.id}]`
      if (_innerState.func) msg += `[${_innerState.func}]`
      let args = [`%c${msg} %s`, `color:${color || _color.grey};${_bold}`]
      if (args[1].includes(_color.grey)) {
        // Remove the unnecessary bold effect to make it easier on the eyes
        args[1] = args[1].replace(_bold, 'font-weight:100;')
      }
      if (data) args.push(data)
      return args
    }

    const _refreshLoggers = () => {
      forEachEntries(_color, (colorKey: ColorKey, color) => {
        o[colorKey] = state.disabled
          ? _noop
          : cons.log.bind(cons, ..._stringifyArgs({ color }))
      })
    }

    function _func(name?: string) {
      if (name) _innerState['func'] = name
      else _innerState['func'] = ''
      if (!state.disabled) _refreshLoggers()
      return this
    }

    _refreshLoggers()

    return o
  }

  return {
    create(id: string) {
      let cached = state.cache[id as keyof typeof state.cache]
      let logger: ReturnType<typeof get>
      if (!cached) {
        logger = get(id)
        state.cache[id] = logger
      } else {
        logger = cached
      }
      return logger
    },
    enable() {
      state.disabled = false
      // cache = { ...cacheBackup }
      // cacheBackup = {}
      return this
    },
    disable() {
      state['disabled'] = true
      state['cacheBackup'] = { ...state.cache }
      Object.values(state.cache).forEach((value) => {
        Object.keys(value).forEach((k) => {
          value[k] = _noop
        })
      })
      return this
    },
  }
})()

export default logger
