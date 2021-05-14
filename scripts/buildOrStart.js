const u = require('@jsmanifest/utils')
const { spawn } = require('child_process')
const color = require('./colors')

/**
 *
 * @param { import('./op') } props
 */
async function buildOrStart(props) {
  console.log('props', props)

  const { config, input = [] } = props
  const { deploy } = props.flags

  let command = input[0] // 'start', 'build', etc
  let lib = '' // Will be found using libInput
  let libInput = input[1] // Regex / alias (ex: 'nui' will be computed to 'noodl-ui')
  let isBuilding = command === 'build'
  let isStart = command === 'start'
  let isDeploying = deploy === true

  try {
    let cmd = ``
    let cmdArgs = []

    const aliases = config.op?.alias

    if (libInput === 'app') {
      // Web app
      cmd += `npm`
      cmdArgs.push('run')
      if (isBuilding) {
        cmdArgs.push(isDeploying ? 'build:deploy:test' : 'build:test')
      } else if (isStarting) {
        cmdArgs.push(`lib:start`)
      }
    } else {
      // Local pkg
      for (const [pkgName, { regex: regexStr }] of u.entries(aliases)) {
        if (new RegExp(regexStr, 'i').test(libInput)) {
          lib = pkgName
          break
        }
      }

      if (!lib) {
        throw new Error(
          `Required lib name for ${color.magenta(command)} script`,
        )
      }

      cmd += `lerna`
      cmdArgs.push(
        'exec',
        '--scope',
        lib,
        `\"npm run ${command}${args._.join(' ')}\"`,
      )
    }

    spawn(cmd, cmdArgs, { stdio: 'inherit', shell: true })
  } catch (error) {
    throw new Error(error.message)
  }
}

module.exports = buildOrStart
