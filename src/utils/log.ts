import _ from 'lodash'

export type LoggerColor = keyof typeof _color

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

export function createLogger(initialName?: string) {
  const _internal = {
    subject: `${initialName}`,
    func: '',
    color: '',
  }

  function _log(msg: string | null | undefined = '', data?: any) {
    let str = `[${_internal.subject}]`
    if (_internal.func) str += `[${_internal.func}]`
    if (msg) str += ` ${msg}`
    let args = [
      `%c${str}`,
      `color:${_internal.color || _color.grey};font-weight:bold;`,
    ]
    if (data !== undefined) args.push(data)
    console.log(...args)
    // Reset func name so they dont become stale and accidentally leak into
    // other logs as a misleading func name. The caller has to manually re-set
    // the func name it on each log/emit as a best practice
    _internal.func = ''
  }

  const colorLog = _.reduce(
    _.entries(_color),
    (acc, [colorKey, color]) => {
      acc[colorKey as LoggerColor] = function (
        ...args: Parameters<typeof _log>
      ) {
        _internal.color = color
        _log(...args)
        return this
      }
      return acc
    },
    {} as Record<LoggerColor, typeof _log>,
  )

  const o = {
    ...colorLog,
    func(name?: string) {
      if (name === undefined) _internal.func = ''
      else _internal.func = name
      return this
    },
    subject(name?: string) {
      if (name === undefined) _internal.subject = ''
      else _internal.subject = name
      return this
    },
  }

  return o
}

export default createLogger
