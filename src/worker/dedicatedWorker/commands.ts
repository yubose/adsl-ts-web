import type { LiteralUnion } from 'type-fest'
import { getOrFetch } from './utils'
import { command as cmd, responseType } from '../../constants'
import * as t from '../workerTypes'

export class Commands<C extends string = string> {
  commands = {} as Record<
    C,
    t.Bg.CommandFn<LiteralUnion<C, string>, Record<string, any>>
  >

  createCommand<Opts extends Record<string, any> = Record<string, any>>(
    command: string,
    fn?: t.Bg.CommandFn<string, Opts>,
  ) {
    const commandFn: typeof fn = async (options, opts) => {
      try {
        return fn?.(options, opts)
      } catch (error) {
        if (error instanceof Error) throw error
        throw new Error(String(error))
      }
    }
    this.commands[command] = commandFn
  }
}

const commands = new Commands()

commands.createCommand<t.Bg.CacheMessageCommand<'CACHE_GET'>['options']>(
  cmd.CACHE_GET,
  async function (options) {
    const { key } = options || {}

    try {
      //
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error(String(error))
    }
  },
)

commands.createCommand<t.Bg.FetchMessageCommand['options']>(
  cmd.FETCH,
  async function (options, { postMessage }) {
    let {
      error,
      env = 'test',
      headers,
      method = 'GET',
      params,
      type = responseType.TEXT,
      url = '',
      version,
    } = options || {}

    postMessage({
      command: cmd.FETCH,
      result: await getOrFetch(url, {
        env,
        headers,
        method,
        version,
        type: type as t.Bg.FetchMessageCommand['options']['type'],
      }),
    })
  },
)

export default commands
