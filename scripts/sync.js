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
async function sync() {
  const toDir = path.join(process.cwd(), './generated')

  async function syncApp({ name, from, to, configFilePath }) {
    console.log(
      `Syncing ${chalk.cyan(name)} from ${chalk.magenta(
        from,
      )} to ${chalk.magenta(to)}`,
    )

    try {
      await fs.copy(from, to, {
        errorOnExist: false,
        preserveTimestamps: false,
        overwrite: true,
        recursive: true,
        dereference: true,
      })

      console.log(
        `${chalk.cyan(`Using`)} config from ${chalk.magenta(configFilePath)}`,
      )

      const toConfigFilePath = path.join(to, path.basename(configFilePath))

      await fs.copy(configFilePath, toConfigFilePath, { overwrite: true })

      if (fs.existsSync(configFilePath)) {
        const yml = await fs.readFile(configFilePath, 'utf8')
        if (yml && u.isStr(yml)) {
          const doc = yaml.parseDocument(yml)
          if (doc) {
            if (doc.has('cadlBaseUrl')) {
              doc.set('cadlBaseUrl', `http://127:0.0.1:3001/`)
              if (doc.has('myBaseUrl')) {
                doc.set('myBaseUrl', `http://127:0.0.1:3001/`)
              }
              await fs.writeFile(
                toConfigFilePath,
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

  await syncApp({
    name: 'search',
    configFilePath: '../aitmed-search/config/searchd2.yml',
    from: '../aitmed-search/search',
    to: './generated/searchd2',
  })

  await syncApp({
    name: 'admin',
    configFilePath: '../aitmed-admin/config/admind2.yml',
    from: '../aitmed-admin/admin',
    to: './generated/admind2',
  })

  await syncApp({
    name: 'testpage',
    configFilePath: '../cadl/config/testpage.yml',
    from: '../cadl/testpage',
    to: './generated/testpage',
  })

  const dirsToSync = [
    '../cadl/meet2',
    '../cadl/meet3',
    '../cadl/www',
    '../cadl2/patient',
    '../cadl2/provider',
  ].reduce((acc, dir) => {
    const folder = dir.substring(dir.lastIndexOf('/') + 1)
    let to = path.join(toDir, folder)
    let toFolder = ''
    if (folder === 'meet2') to = to.replace('meet2', 'meetd2')
    if (folder === 'patient') to = to.replace('patient', 'patd2')
    if (folder === 'provider') to = to.replace('provider', 'prod2')
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
    `cd ../cadl && git reset --hard origin/master && git pull -f && cd ../cadl2 && git reset --hard origin/master && git pull -f && cd ../aitmed-search && git reset --hard origin/master && git pull -f`,
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

module.exports = sync
