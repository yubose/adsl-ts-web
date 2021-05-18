const u = require('@jsmanifest/utils')
const execa = require('execa')
const color = require('./colors')

const colors = [color.aquamarine, color.cyan, color.coolGold, color.fadedSalmon]

/**
 *
 * @param { import('./op') } props
 */
function buildOrStart(props) {
  function startWebApp() {
    getShell(
      {
        command: 'npm',
        args: ['run', 'start:test'],
        opts: { shell: true },
      },
      (data) => console.log(`[${color.brightGreen('app')}] ${data}`),
    )
  }

  /**
   * @param { object } options
   * @param { [string, string[] ] } options.args
   * @param { string } options.label
   * @param { execa.Options } options.opts
   * @param { (data: string) => void } onData
   */
  function getShell({ command, args, label, opts }, onData) {
    const shell = execa.commandSync(`${command} ${args.join(' ')}`, {
      shell: true,
      encoding: 'utf8',
      stdio: 'inherit',
      ...opts,
    })
    shell.stdout.on('close', () => console.log(`[${label}] close`))
    shell.stdout.on('end', () => console.log(`[${label}] end`))
    shell.stdout.on('error', () => console.log(`[${label}] error`))
    shell.stdout.on('pause', () => console.log(`[${label}] pause`))
    shell.stdout.on('data', (c) => onData?.(c.toString().trim()))
    return shell
  }

  try {
    let { config, flags } = props
    let { build, start } = flags

    let command = build ? 'build' : 'start'
    let inputs = (build || start).split(',').filter(Boolean)
    let isAppIncluded = start === 'app' || inputs.includes('app')

    console.log(`command: ${u.magenta(command)}`)
    console.log(`inputs`, inputs)
    console.log(`isAppIncluded`, isAppIncluded)
    u.newline()

    isAppIncluded && (inputs = inputs.filter((s) => !!s && s !== 'app'))

    const entries = u.entries(config.regex.packages)
    const numEntries = entries.length

    console.log(entries)
    

    for (let index = 0; index < numEntries; index++) {
      const [regex, pkg] = entries[index]
      console.log(regex)
      for (const input of inputs) {
        const matches = new RegExp(regex, 'i').test(input)
        if (matches) {
          const shell = getShell(
            {
              command: 'lerna',
              args: [`exec`, `--scope`, pkg, `"npm run ${command}"`],
            },
            (data) => {
              console.log(`[${label}]: ${data}`)
              ;/bundle/i.test(data) && isAppIncluded && startWebApp()
            },
          )
          break
        }
        // console.log({
        //   command,
        //   color,
        //   isAppIncluded,
        //   matches,
        //   regex,
        //   pkg,
        //   input,
        //   inputs,
        // })
      }
    }
  } catch (error) {
    throw new Error(error.message)
  }
}

module.exports = buildOrStart
