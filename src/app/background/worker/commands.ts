import { command as cmd, responseType } from '../../../constants'
import * as t from '../../../modules/NoodlWorker/types'

class Commands<C extends string = string> {
  commands = {} as Record<C, t.Bg.CommandFn<C, Record<string, any>>>

  createCommand<Opts extends Record<string, any> = Record<string, any>>(
    command: string,
    fn: t.Bg.CommandFn<string, Opts>,
  ) {
    const commandFn: typeof fn = async (options, opts) => {
      try {
        return fn(options, opts)
      } catch (error) {
        if (error instanceof Error) throw error
        throw new Error(String(error))
      }
    }
    this.commands[command] = commandFn
  }
}

const commands = new Commands()

commands.createCommand<t.Bg.FetchMessageCommand['options']>(
  cmd.FETCH,
  async function (options, { postMessage }) {
    const {
      error,
      headers,
      method = 'GET',
      params,
      type = responseType.TEXT,
      url = '',
    } = options || {}
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': type,
          ...headers,
        },
        method,
      })
      const responseMethod = type.substring(type.indexOf('/'))
      const result = await response?.[type]?.(responseMethod)
      postMessage({ command: cmd.FETCH, result })
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error(String(error))
    }
  },
)

export default commands
