const { spawn, exec, execFile } = require('child_process')
const chalk = require('chalk')

/**
 *
 * @param { import('./op') } props
 */
async function buildOrStart(props) {
  console.log('props', props)

  try {
    let tag = start ? 'start' : build ? 'build' : test ? 'test' : 'test:file'
    let cmd = ``
    let cmdArgs = []
    let lib = ``

    for (const pair of libReg) {
      const obj = pair.value
      const regexStr = obj.get('regex')
      const regex = new RegExp(regexStr, 'i')
      if (regex.test(args[tag])) lib = pair.key.value
    }

    if (!lib && testfile) {
      // lib = testfile.join(' ')
    }

    if (!lib) {
      throw new Error(`Required lib name for ${chalk.magenta(tag)} script`)
    }

    cmd += `lerna`
    cmdArgs.push(
      'exec',
      '--scope',
      lib,
      `\"npm run ${tag}${args._.join(' ')}\"`,
    )
    spawn(cmd, cmdArgs, { stdio: 'inherit', shell: true })
  } catch (error) {
    throw new Error(error.message)
  }
}

module.exports = buildOrStart
