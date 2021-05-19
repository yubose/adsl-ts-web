const u = require('@jsmanifest/utils')
const execa = require('execa')
const { spawn } = require('child_process')
const color = require('./colors')

const colors = [color.aquamarine, color.cyan, color.coolGold, color.fadedSalmon]

/**
 *
 * @param { import('./op') } props
 */
function buildOrStart(props) {
  function startWebApp() {
    const shell = execa('npm', ['run', 'start:test'], { stdio: 'inherit' })
    // const shell = getShell(
    //   {
    //     command: 'npm',
    //     args: ['run', 'start:test'],
    //     label: 'app',
    //     color: color.brightGreen,
    //     opts: { stdio: 'inherit' },
    //   },
    //   (data) => console.log(`[${color.brightGreen('app')}] ${data}`),
    // )
  }

  /**
   * @param { object } options
   * @param { [string, string[] ] } options.args
   * @param { string } options.label
   * @param { execa.Options } options.opts
   * @param { (data: string) => void } onData
   */
  function getShell({ command, args, label: labelProp, color, opts }, onData) {
    const label = color(labelProp)
    console.info({ command, args, opts, label })
    const shell = execa(command, args, { shell: true, ...opts })
    // shell.stdout.on('close', () => console.log(`[${label}] close`))
    // shell.stdout.on('end', () => console.log(`[${label}] end`))
    // shell.stdout.on('error', () => console.log(`[${label}] error`))
    // shell.stdout.on('pause', () => console.log(`[${label}] pause`))
    // shell.stdout.on('data', (c) => onData?.(c.toString().trim()))
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
    u.newline()

    // Run lib:start then start:test
    if (command === 'start' && start === '' && !inputs.length) {
      /** @type { ChildProcess } appShell */
      let appShell

      const libShell = execa('npm', ['run', 'lib:start'], { detached: true })

      libShell.stdout.on('data', (chunk) => {
        const data = Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : chunk
        if (/bundle/i.test(data)) {
          appShell = spawn('npm', ['run', 'start:test'], {
            detached: true,
            stdio: 'inherit',
          })
        } else {
          process.stdout.write(data)
        }
      })

      // process.on('message', (data) => {
      //   console.log(`data`, data)
      // })
    } else {
      let index = 0
      for (const [regexStr, pkg] of u.entries(config.regex.packages)) {
        const regex = new RegExp(regexStr, 'i')
        for (const input of inputs) {
          const matches = regex.test(input)
          if (matches) {
            console.log({ matches, input, regex })
            const color = colors[index++]
            const commandArgs = [`exec`, `--scope`, pkg, `"npm run ${command}"`]
            const shell = getShell(
              {
                command: 'lerna',
                args: commandArgs,
                label: pkg,
                color,
              },
              (data) => {
                console.log(`[${color(pkg)}]: ${data}`)
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
    }
  } catch (error) {
    throw new Error(error.message)
  }
}

module.exports = buildOrStart
