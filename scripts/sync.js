const execa = require('execa')
const u = require('@jsmanifest/utils')
const yaml = require('yaml')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')

/**
 *
 * @param { import('./op') } props
 */
async function split() {
  const toDir = path.join(process.cwd(), './generated')
  const dirsToSync = [
    '../cadl/meet2',
    '../cadl/meet3',
    '../cadl/testpage',
    '../cadl/www',
    '../cadl2/admin',
    '../cadl2/patient',
    '../cadl2/provider',
    '../cadl2/search',
  ].reduce((acc, dir) => {
    const folder = dir.substring(dir.lastIndexOf('/') + 1)
    let to = path.join(toDir, folder)
    let toFolder = ''
    if (folder === 'admin') to = to.replace('admin', 'admind2')
    if (folder === 'meet2') to = to.replace('meet2', 'meetd2')
    if (folder === 'patient') to = to.replace('patient', 'patientd2')
    if (folder === 'provider') to = to.replace('provider', 'providerd2')
    if (folder === 'search') to = to.replace('search', 'searchd2')
    toFolder = path.basename(to)
    acc.push({
      folder,
      pathname: dir,
      toFolder,
      to,
      configPath: path.join(dir, `../config/${folder}.yml`),
    })
    return acc
  }, [])

  if (!fs.existsSync(toDir)) {
    fs.ensureDirSync(toDir)
    console.log(
      `${chalk.cyan(
        `New directory`,
      )} Created a new directory at ${chalk.magenta(toDir)}`,
    )
  }

  await execa.command(
    `cd ../cadl && git reset --hard origin/master && git pull -f && cd ../cadl2 && git reset --hard origin/master && git pull -f`,
    {
      shell: true,
      stdio: 'inherit',
    },
  )

  for (const obj of dirsToSync) {
    let { configPath, folder, pathname, to, toFolder } = obj
    console.log(`${chalk.cyan('Syncing')} from ${chalk.magenta(pathname)}`)

    try {
      await fs.copy(pathname, to, {
        errorOnExist: false,
        preserveTimestamps: false,
        overwrite: true,
        recursive: true,
        dereference: true,
      })

      console.log(
        `${chalk.cyan(`Syncing`)} config from ${chalk.magenta(configPath)}`,
      )

      const targetConfigPath =
        path.join(toDir, toFolder, path.basename(to)) + '.yml'

      await fs.copy(configPath, targetConfigPath, { overwrite: true })

      if (fs.existsSync(targetConfigPath)) {
        const yml = await fs.readFile(targetConfigPath, 'utf8')
        if (yml && u.isStr(yml)) {
          const doc = yaml.parseDocument(yml)
          if (doc) {
            if (doc.has('cadlBaseUrl')) {
              doc.set('cadlBaseUrl', `http://127:0.0.1:3001/`)
              if (doc.has('myBaseUrl')) {
                doc.set('myBaseUrl', `http://127:0.0.1:3001/`)
              }
              await fs.writeFile(
                targetConfigPath,
                yaml.stringify(doc, { indent: 2 }),
                'utf8',
              )
            }
          }
        }
      }
    } catch (err) {
      console.log('')
      console.log(`[${chalk.yellow(err.name)}]: ${chalk.red(err.message)}`)
      // throw new Error(err.message)
    }
  }
}

module.exports = split
