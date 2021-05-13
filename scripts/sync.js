const { spawn, exec, execFile } = require('child_process')
const chalk = require('chalk')

/**
 *
 * @param { import('./op') } props
 */
async function split(props) {
  console.log('props', props)

  const syncDirName = sync
  const baseDir = path.join(process.cwd(), '../cadl')
  const configDir = path.join(baseDir, 'config')
  const fromDir = path.join(baseDir, syncDirName)
  const toDir = path.join(process.cwd(), './server')
  const configFileName = `${configId}.yml`
  console.log(`${tag('Syncing')} from ${magenta(baseDir)}`)

  if (!fs.existsSync(toDir)) {
    fs.ensureDirSync(toDir)
    console.log(
      `${tag(`New directory`)} Created a new directory at ${magenta(toDir)}`,
    )
  }

  if (!configId) {
    throw new Error(
      red(
        `Please choose a config to use (${cyan('ex:')} "${italic(
          'meet4.yml',
        )}" to use ${italic('meet4')} config)`,
      ),
    )
  }

  try {
    console.log(
      `${tag('Copying')} ${yellow(configId)} config from ${magenta(
        path.join(configDir, configFileName),
      )} to ${magenta(path.join(toDir, configFileName))}`,
    )
    await fs.copyFile(
      path.join(configDir, configFileName),
      path.join(toDir, configFileName),
    )
    const files = await fs.readdir(fromDir)
    console.log(
      `${tag(`Copying`)} ${yellow(`${files.length} files`)} from ${magenta(
        fromDir,
      )}`,
    )
    await fs.copy(fromDir, toDir, {
      errorOnExist: false,
      preserveTimestamps: false,
      overwrite: true,
      recursive: true,
    })
    console.log(
      `${tag(`Copied`)} ${yellow(`${files.length} files`)} to ${magenta(
        toDir,
      )}`,
    )
    console.log('')
  } catch (err) {
    console.log('')
    throw new Error(err.message)
  }
}

module.exports = split
