const execa = require('execa')
const u = require('@jsmanifest/utils')
const yaml = require('yaml')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const axios = require('axios')
const cpy = require('cpy')

const aqua = (s) => chalk.keyword('aquamarine')(s)
const coolGold = (s) => chalk.keyword('navajowhite')(s)
const tag = (s) => `[${u.cyan(s)}]`
const log = console.log

/**
 *
 * @param { import('./op') } props
 */
async function sync() {
  const toDir = path.join(process.cwd(), './generated')

  async function syncRepos(repos) {
    /**
     * @param { string } url - Git repo url
     * @param { string } baseDir - Base directory
     * @param { string } appDir - Directory to the app files (.yml/assets)
     * @param { string | string[] } configFilePath - Filepath to the config file
     */
    async function syncRepo(repo) {
      const { url = '', from, to } = repo

      try {
        let { baseDir, appFiles, configFrom } = from
        let { targetDir } = to
        let gitFolder = path.posix.basename(baseDir)
        let gitFolderPath = path.posix.resolve(path.join(baseDir, gitFolder))

        baseDir = path.resolve(baseDir)
        appFiles = path.join(baseDir, appFiles)
        configFrom = u.array(configFrom).map((c) => path.join(baseDir, c))
        targetDir = path.resolve(process.cwd(), targetDir).replace(/\\/g, '/')

        /** @type { execa.ExecaChildProcess } */
        let cmd
        let configNames = u.reduce(
          configFrom,
          (acc, name) =>
            u.assign(acc, { [path.basename(name)]: path.basename(name) }),
          {},
        )

        console.log({
          repo,
          baseDir,
          appFiles,
          configFrom,
          targetDir,
          gitFolderPath,
          configNames,
        })

        if (!fs.existsSync(baseDir)) {
          cmd = await execa.command(`git clone ${url} ${gitFolder}`, {
            shell: true,
            stdio: 'inherit',
          })
          log(`${tag('git cloned')} to ${u.yellow(gitFolderPath)}`)
        }

        await fs.ensureDir(gitFolderPath)

        const configYmls = (
          await Promise.all(
            u.array(configFrom).map(async (filepath) => {
              try {
                const yml = await fs.readFile(filepath, 'utf8')
                await fs.writeFile(path.join(targetDir, configName), 'utf8')
                return yml
              } catch (error) {
                log(`${tag('Error')}: ${error.message}`)
              }
            }),
          )
        ).filter(Boolean)

        await cpy(path.join(appFiles, '**/*'), targetDir)
      } catch (error) {
        console.error(error)
      }
    }

    try {
      await Promise.all(repos.map(async (repo) => syncRepo(repo)))
    } catch (error) {
      console.error(error)
    }
  }

  await syncRepos([
    {
      from: {
        url: 'http://gitlab.aitmed.com/production/admin.git',
        baseDir: '../../admind2',
        appFiles: 'admin',
        configFrom: [
          'config/admin.yml',
          'config/admind.yml',
          'config/admind2.yml',
        ],
      },
      to: {
        targetDir: 'generated/admind2',
      },
    },
    // {
    //   from: {
    //     url: 'http://gitlab.aitmed.com/production/search.git',
    //     baseDir: '../../searchd2',
    //     appFiles: 'search',
    //     configFrom: [
    //       'config/search.yml',
    //       'config/searchd.yml',
    //       'config/searchd2.yml',
    //     ],
    //   },
    //   to: {
    //     targetDir: 'generated/searchd2',
    //   },
    // },
  ])

  return

  async function syncApp({ name, from, to, configPath }) {
    const configFilePathFrom = path.resolve(path.join(from, configPath))
    const configFilePathTo = path.resolve(path.join(to, configPath))

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
        `${chalk.cyan(`Using`)} config from ${chalk.magenta(configPath)}`,
      )

      await fs.copy(configPath, configFilePathTo, { overwrite: true })

      if (fs.existsSync(configPath)) {
        const yml = await fs.readFile(configPath, 'utf8')
        if (yml && u.isStr(yml)) {
          const doc = yaml.parseDocument(yml)
          if (doc) {
            if (doc.has('cadlBaseUrl')) {
              doc.set('cadlBaseUrl', `http://127:0.0.1:3001/`)
              if (doc.has('myBaseUrl')) {
                doc.set('myBaseUrl', `http://127:0.0.1:3001/`)
              }
              await fs.writeFile(
                configFilePathTo,
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
    configPath: 'config/searchd2.yml',
    from: '../aitmed-search/search',
    to: './generated/searchd2',
  })

  await syncApp({
    name: 'admin',
    configPath: '../aitmed-admin/config/admind2.yml',
    from: '../aitmed-admin/admin',
    to: './generated/admind2',
  })

  await syncApp({
    name: 'admin',
    configPath: '../aitmed-admin/config/admind2.yml',
    from: '../aitmed-sadmin/superadmin',
    to: './generated/superadmin',
    repo: 'http://gitlab.aitmed.com/production/superadmin.git',
  })

  await syncApp({
    name: 'testpage',
    configPath: '../cadl/config/testpage.yml',
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
