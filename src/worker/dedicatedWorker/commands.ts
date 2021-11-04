import * as nt from 'noodl-types'
import { parse as parseYml } from 'yaml'
import { command as cmd, responseType } from '../../constants'
import * as t from '../workerTypes'

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

commands.createCommand<t.Bg.CacheMessageCommand<'CACHE_GET'>['options']>(
  cmd.CACHE_GET,
  async function (options, { db, store, transaction }) {
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
  async function (options, { postMessage, store }) {
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

    try {
      if (url.startsWith('config:')) {
        const urlOrKey = url.split(':')[1]
        let config: nt.RootConfig | undefined

        if (urlOrKey.startsWith('http')) {
          const resp = await fetch(urlOrKey)
          const yml = await resp.text()
          config = parseYml(yml, { prettyErrors: true })
        } else {
          const req = store.get('config')

          req.addEventListener(
            'success',
            (evt) => {
              config = req.result
              const configVersion = config?.web?.cadlVersion?.[env]
              if (configVersion && configVersion === version) {
                // Send the cached config
                postMessage({ command: cmd.FETCH, result: config })
              } else {
                // Fetch a new one
              }
            },
            { once: true },
          )

          req.addEventListener(
            'error',
            (evt) => {
              //
            },
            { once: true },
          )
        }

        if (config) {
          postMessage({ command: cmd.FETCH, result: config })
        } else {
          //
        }
      } else if (url.startsWith('preload:')) {
        const urlOrKey = url.split(':')[1]
      } else if (url.startsWith('page:')) {
        //
      } else {
        const responseMethod = type.substring(type.indexOf('/'))
        const response = await fetch(url, {
          headers: {
            'Content-Type': type,
            ...headers,
          },
          method,
        })
        const result = await response?.[type]?.(responseMethod)

        postMessage({ command: cmd.FETCH, result })
      }
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error(String(error))
    }
  },
)

export default commands
